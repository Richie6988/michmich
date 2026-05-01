import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vote, VoteType, VoteResponse } from './entities/vote.entity';
import { DatePoll, DatePollOption } from './entities/date-poll.entity';
import { Trip } from '../trips/entities/trip.entity';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,
    @InjectRepository(DatePoll)
    private readonly pollRepo: Repository<DatePoll>,
    @InjectRepository(DatePollOption)
    private readonly optionRepo: Repository<DatePollOption>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
  ) {}

  // ============================================================
  // Generic votes (pin, venue, accommodation)
  // ============================================================

  async listVotes(tripId: string, voteType: VoteType): Promise<Vote[]> {
    return this.voteRepo.find({
      where: { tripId, voteType },
      relations: ['user'],
      order: { votedAt: 'DESC' },
    });
  }

  async castVote(
    tripId: string, userId: string, voteType: VoteType, targetId: string, response: VoteResponse,
  ): Promise<Vote> {
    await this.ensureMember(tripId, userId);

    // For pin/venue/accommodation: one vote per (user, target)
    // Replace existing
    const existing = await this.voteRepo.findOne({
      where: { tripId, userId, voteType, targetId },
    });
    if (existing) {
      existing.response = response;
      existing.votedAt = new Date();
      return this.voteRepo.save(existing);
    }
    const vote = this.voteRepo.create({
      tripId, userId, voteType, targetId, response,
    });
    return this.voteRepo.save(vote);
  }

  async clearVote(tripId: string, userId: string, voteType: VoteType, targetId: string): Promise<void> {
    await this.voteRepo.delete({ tripId, userId, voteType, targetId });
  }

  // ============================================================
  // Date poll
  // ============================================================

  async getPoll(tripId: string): Promise<DatePoll | null> {
    return this.pollRepo.findOne({
      where: { tripId },
      relations: ['options'],
    });
  }

  async addOption(tripId: string, userId: string, dateIso: string): Promise<DatePoll> {
    await this.ensureMember(tripId, userId);
    let poll = await this.getPoll(tripId);
    if (!poll) {
      poll = this.pollRepo.create({ tripId, status: 'open' });
      await this.pollRepo.save(poll);
    }
    // Avoid duplicates by date
    const existing = await this.optionRepo.findOne({
      where: { pollId: poll.id, date: new Date(dateIso) },
    });
    if (!existing) {
      const opt = this.optionRepo.create({
        pollId: poll.id,
        date: new Date(dateIso),
        score: 0,
      });
      await this.optionRepo.save(opt);
    }
    return this.getPoll(tripId) as Promise<DatePoll>;
  }

  async voteDate(
    tripId: string, userId: string, optionId: string, response: 'yes' | 'maybe' | 'no',
  ): Promise<DatePoll> {
    await this.ensureMember(tripId, userId);
    const poll = await this.getPoll(tripId);
    if (!poll) throw new NotFoundException('No date poll for this trip');

    // Replace existing vote
    await this.voteRepo.delete({
      tripId, userId, voteType: 'date', targetId: optionId,
    });
    const vote = this.voteRepo.create({
      tripId, userId, voteType: 'date', targetId: optionId, response,
    });
    await this.voteRepo.save(vote);

    // Recompute scores per option (yes=2, maybe=1, no=0)
    for (const opt of poll.options) {
      const votes = await this.voteRepo.find({
        where: { tripId, voteType: 'date', targetId: opt.id },
      });
      const score = votes.reduce(
        (s, v) => s + (v.response === 'yes' ? 2 : v.response === 'maybe' ? 1 : 0),
        0,
      );
      opt.score = score;
      await this.optionRepo.save(opt);
    }

    return this.getPoll(tripId) as Promise<DatePoll>;
  }

  async closePoll(tripId: string, userId: string, selectedOptionId: string): Promise<DatePoll> {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can close the poll');
    }
    const poll = await this.getPoll(tripId);
    if (!poll) throw new NotFoundException('No poll');
    poll.status = 'closed';
    poll.selectedOptionId = selectedOptionId;
    await this.pollRepo.save(poll);
    // Also set the trip's scheduledAt to the chosen date
    const opt = poll.options.find(o => o.id === selectedOptionId);
    if (opt) {
      trip.scheduledAt = opt.date;
      await this.tripRepo.save(trip);
    }
    return this.getPoll(tripId) as Promise<DatePoll>;
  }

  // ============================================================
  // Helpers
  // ============================================================

  private async ensureMember(tripId: string, userId: string): Promise<void> {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['participants'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    const isMember =
      trip.organizerId === userId ||
      trip.participants.some(p => p.userId === userId);
    if (!isMember) throw new ForbiddenException('Not a member of this trip');
  }
}
