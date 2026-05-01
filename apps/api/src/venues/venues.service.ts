import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Venue, Accommodation, VenueCategory } from './entities/venue.entity';

@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue)
    private readonly venueRepo: Repository<Venue>,
    @InjectRepository(Accommodation)
    private readonly accRepo: Repository<Accommodation>,
  ) {}

  /**
   * Find venues within a radius of a point (PostGIS geography).
   * Distance ordering, optional category filter.
   */
  async findNear(
    lat: number, lng: number, radiusMeters = 1000, category?: VenueCategory, limit = 30,
  ): Promise<Venue[]> {
    const qb = this.venueRepo.createQueryBuilder('v')
      .where(`ST_DWithin(v.location, ST_MakePoint(:lng, :lat)::geography, :radius)`, {
        lat, lng, radius: radiusMeters,
      });
    if (category) {
      qb.andWhere('v.category = :category', { category });
    }
    return qb
      .orderBy(`v.location <-> ST_MakePoint(:lng, :lat)::geography`)
      .limit(limit)
      .getMany();
  }

  // ========= Accommodations (per-trip, mock catalog seeded) =========

  async listForTrip(tripId: string): Promise<Accommodation[]> {
    return this.accRepo.find({ where: { tripId }, order: { pricePerNight: 'ASC' } });
  }

  async vote(_tripId: string, _accId: string, _userId: string, _response: string): Promise<void> {
    // delegated to VotesService via voteType='accommodation'
  }

  async select(tripId: string, accId: string): Promise<Accommodation> {
    // Clear any previously selected
    await this.accRepo.update({ tripId }, { selected: false });
    const acc = await this.accRepo.findOne({ where: { id: accId, tripId } });
    if (!acc) throw new Error('Accommodation not found');
    acc.selected = true;
    return this.accRepo.save(acc);
  }

  async addAccommodation(tripId: string, data: Partial<Accommodation>): Promise<Accommodation> {
    const acc = this.accRepo.create({ ...data, tripId });
    return this.accRepo.save(acc);
  }
}
