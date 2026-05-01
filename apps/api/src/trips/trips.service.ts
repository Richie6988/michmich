import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';

import { Trip } from './entities/trip.entity';
import { TripParticipant } from './entities/trip-participant.entity';
import { Task } from './entities/task.entity';
import { TripPhoto } from './entities/trip-photo.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateTripDto, UpdateTripDto, UpdateParticipantConstraintsDto,
  CreateTaskDto, CreatePhotoDto,
} from './dto/trip.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(TripParticipant)
    private readonly participantRepo: Repository<TripParticipant>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TripPhoto)
    private readonly photoRepo: Repository<TripPhoto>,
  ) {}

  // ============================================================
  // Trip CRUD
  // ============================================================

  async listForUser(userId: string): Promise<Trip[]> {
    // Trips where user is organizer OR participant
    const trips = await this.tripRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.organizer', 'organizer')
      .leftJoinAndSelect('t.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'pUser')
      .where('t.organizerId = :userId', { userId })
      .orWhere(qb => {
        const sub = qb
          .subQuery()
          .select('p.tripId')
          .from(TripParticipant, 'p')
          .where('p.userId = :userId')
          .getQuery();
        return `t.id IN ${sub}`;
      })
      .setParameter('userId', userId)
      .orderBy('t.createdAt', 'DESC')
      .getMany();
    return trips;
  }

  async findById(id: string, userId: string): Promise<Trip> {
    const trip = await this.tripRepo.findOne({
      where: { id },
      relations: ['organizer', 'participants', 'participants.user'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    // Access check: organizer OR participant
    const hasAccess =
      trip.organizerId === userId ||
      trip.participants.some(p => p.userId === userId);
    if (!hasAccess) throw new ForbiddenException('No access to this trip');
    return trip;
  }

  async findByInviteToken(token: string): Promise<Trip | null> {
    return this.tripRepo.findOne({
      where: { inviteToken: token },
      relations: ['organizer', 'participants', 'participants.user'],
    });
  }

  async create(organizerId: string, dto: CreateTripDto): Promise<Trip> {
    const trip = this.tripRepo.create({
      name: dto.name,
      description: dto.description || null,
      organizerId,
      tripType: (dto.tripType as any) || 'custom',
      mode: dto.mode || 'wanderlust',
      status: 'inviting',
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      inviteToken: randomBytes(16).toString('hex'),
    });
    await this.tripRepo.save(trip);

    // Add organizer as accepted participant
    const organizerParticipant = this.participantRepo.create({
      tripId: trip.id,
      userId: organizerId,
      status: 'accepted',
    });
    await this.participantRepo.save(organizerParticipant);

    // Add invited friends by name
    if (dto.friendNames && dto.friendNames.length > 0) {
      const inviteParticipants = dto.friendNames
        .filter(n => n && n.trim())
        .map(name =>
          this.participantRepo.create({
            tripId: trip.id,
            userId: null,
            guestName: name.trim(),
            status: 'invited',
          }),
        );
      if (inviteParticipants.length > 0) {
        await this.participantRepo.save(inviteParticipants);
      }
    }

    return this.findById(trip.id, organizerId);
  }

  async update(id: string, userId: string, dto: UpdateTripDto): Promise<Trip> {
    const trip = await this.findById(id, userId);
    if (trip.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can update the trip');
    }
    Object.assign(trip, {
      name: dto.name ?? trip.name,
      description: dto.description ?? trip.description,
      status: dto.status ?? trip.status,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : trip.scheduledAt,
      endDate: dto.endDate ? new Date(dto.endDate) : trip.endDate,
      stealthMode: dto.stealthMode ?? trip.stealthMode,
    });
    await this.tripRepo.save(trip);
    return this.findById(id, userId);
  }

  async duplicate(id: string, userId: string, newName?: string): Promise<Trip> {
    const src = await this.findById(id, userId);
    const newTrip = this.tripRepo.create({
      name: newName || `${src.name} (copy)`,
      description: src.description,
      organizerId: src.organizerId,
      tripType: src.tripType,
      mode: src.mode,
      status: 'inviting',
      scheduledAt: null,
      endDate: null,
      stealthMode: src.stealthMode,
      maxTimeBudget: src.maxTimeBudget,
      maxMoneyBudget: src.maxMoneyBudget,
      inviteToken: randomBytes(16).toString('hex'),
    });
    await this.tripRepo.save(newTrip);

    // Clone participants but reset status + computed fields
    for (const p of src.participants) {
      const dup = this.participantRepo.create({
        tripId: newTrip.id,
        userId: p.userId,
        guestName: p.guestName,
        status: p.userId === src.organizerId ? 'accepted' : 'invited',
        transportMode: p.transportMode,
        timeWeight: p.timeWeight,
        moneyWeight: p.moneyWeight,
        maxTime: p.maxTime,
        maxTimeUnit: p.maxTimeUnit,
        maxMoney: p.maxMoney,
        maxMoneyCurrency: p.maxMoneyCurrency,
        email: p.email,
        selfBook: p.selfBook,
        reductionCards: p.reductionCards,
        originLocation: p.originLocation,
        originLabel: p.originLabel,
      });
      await this.participantRepo.save(dup);
    }

    return this.findById(newTrip.id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const trip = await this.findById(id, userId);
    if (trip.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can delete the trip');
    }
    await this.tripRepo.delete(id);
  }

  // ============================================================
  // Participants
  // ============================================================

  async addParticipantByName(tripId: string, userId: string, name: string): Promise<TripParticipant> {
    const trip = await this.findById(tripId, userId);
    if (trip.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can add participants');
    }
    const p = this.participantRepo.create({
      tripId,
      userId: null,
      guestName: name.trim(),
      status: 'invited',
    });
    return this.participantRepo.save(p);
  }

  async removeParticipant(tripId: string, userId: string, participantId: string): Promise<void> {
    const trip = await this.findById(tripId, userId);
    if (trip.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can remove participants');
    }
    if (participantId === trip.organizerId) {
      throw new ForbiddenException("Cannot remove the organizer");
    }
    await this.participantRepo.delete({ id: participantId, tripId });
  }

  async updateMyConstraints(
    tripId: string, userId: string, dto: UpdateParticipantConstraintsDto,
  ): Promise<TripParticipant> {
    const participant = await this.participantRepo.findOne({
      where: { tripId, userId },
    });
    if (!participant) throw new NotFoundException('Not a participant of this trip');

    // Apply scalars
    Object.assign(participant, {
      transportMode: dto.transportMode ?? participant.transportMode,
      timeWeight: dto.timeWeight ?? participant.timeWeight,
      moneyWeight: dto.moneyWeight ?? participant.moneyWeight,
      maxTime: dto.maxTime ?? participant.maxTime,
      maxTimeUnit: dto.maxTimeUnit ?? participant.maxTimeUnit,
      maxMoney: dto.maxMoney ?? participant.maxMoney,
      maxMoneyCurrency: dto.maxMoneyCurrency ?? participant.maxMoneyCurrency,
      email: dto.email ?? participant.email,
      selfBook: dto.selfBook ?? participant.selfBook,
      reductionCards: dto.reductionCards ?? participant.reductionCards,
      originLabel: dto.originLabel ?? participant.originLabel,
    });

    if (dto.originLat != null && dto.originLng != null) {
      participant.originLocation = { type: 'Point', coordinates: [dto.originLng, dto.originLat] };
    }

    if (participant.transportMode && participant.maxTime != null && participant.maxMoney != null) {
      participant.status = 'constraints_set';
    }

    return this.participantRepo.save(participant);
  }

  async acceptInvite(tripId: string, userId: string, guestName?: string): Promise<TripParticipant> {
    const trip = await this.findById(tripId, userId).catch(() => null);
    if (!trip) {
      // User isn't yet a participant - check via inviteToken flow handled elsewhere
      throw new NotFoundException('Trip not found');
    }
    let participant = await this.participantRepo.findOne({
      where: { tripId, userId },
    });
    if (!participant && guestName) {
      // Match by guest name (was invited by name)
      participant = await this.participantRepo.findOne({
        where: { tripId, guestName, userId: null as any },
      });
      if (participant) {
        participant.userId = userId;
        participant.guestName = null;
      }
    }
    if (!participant) {
      participant = this.participantRepo.create({
        tripId, userId, status: 'accepted',
      });
    } else {
      participant.status = 'accepted';
    }
    return this.participantRepo.save(participant);
  }

  // ============================================================
  // Tasks
  // ============================================================

  async listTasks(tripId: string, userId: string): Promise<Task[]> {
    await this.findById(tripId, userId); // access check
    return this.taskRepo.find({
      where: { tripId },
      relations: ['assignedTo', 'createdBy'],
      order: { completed: 'ASC', createdAt: 'ASC' },
    });
  }

  async createTask(tripId: string, userId: string, dto: CreateTaskDto): Promise<Task> {
    await this.findById(tripId, userId);
    const task = this.taskRepo.create({
      tripId,
      title: dto.title,
      description: dto.description || null,
      assignedToId: dto.assignedToId || null,
      createdById: userId,
      completed: false,
    });
    return this.taskRepo.save(task);
  }

  async toggleTask(tripId: string, userId: string, taskId: string): Promise<Task> {
    await this.findById(tripId, userId);
    const task = await this.taskRepo.findOne({ where: { id: taskId, tripId } });
    if (!task) throw new NotFoundException('Task not found');
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;
    return this.taskRepo.save(task);
  }

  async removeTask(tripId: string, userId: string, taskId: string): Promise<void> {
    await this.findById(tripId, userId);
    await this.taskRepo.delete({ id: taskId, tripId });
  }

  async reassignTask(
    tripId: string, userId: string, taskId: string, assignedToId: string | null,
  ): Promise<Task> {
    await this.findById(tripId, userId);
    const task = await this.taskRepo.findOne({ where: { id: taskId, tripId } });
    if (!task) throw new NotFoundException('Task not found');
    task.assignedToId = assignedToId;
    return this.taskRepo.save(task);
  }

  // ============================================================
  // Photos
  // ============================================================

  async listPhotos(tripId: string, userId: string): Promise<TripPhoto[]> {
    await this.findById(tripId, userId);
    return this.photoRepo.find({
      where: { tripId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async addPhoto(tripId: string, user: User, dto: CreatePhotoDto): Promise<TripPhoto> {
    await this.findById(tripId, user.id);
    const photo = this.photoRepo.create({
      tripId,
      imageUrl: dto.imageUrl,
      caption: dto.caption || null,
      uploadedById: user.id,
      uploadedByName: user.firstName,
    });
    return this.photoRepo.save(photo);
  }

  async removePhoto(tripId: string, userId: string, photoId: string): Promise<void> {
    await this.findById(tripId, userId);
    const photo = await this.photoRepo.findOne({ where: { id: photoId, tripId } });
    if (!photo) throw new NotFoundException('Photo not found');
    if (photo.uploadedById !== userId) {
      throw new ForbiddenException('Only the uploader can remove this photo');
    }
    await this.photoRepo.delete(photoId);
  }
}
