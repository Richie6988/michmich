import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { User } from '../../users/entities/user.entity';

export type VoteType = 'pin' | 'venue' | 'accommodation' | 'date';
export type VoteResponse = 'love' | 'meh' | 'no' | 'yes' | 'maybe';

/**
 * Polymorphic vote table — covers pin votes, venue votes, accommodation votes, date poll votes.
 * Discriminator: voteType. targetId references the appropriate entity (zone id, venue id,
 * accommodation id, date option id).
 */
@Entity('votes')
@Index(['tripId', 'voteType'])
@Index(['userId'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, t => t.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, u => u.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'vote_type',
    type: 'enum',
    enum: ['pin', 'venue', 'accommodation', 'date'],
  })
  voteType: VoteType;

  /** ID of the thing being voted on - depends on voteType (zoneId, venueId, accommodationId, dateOptionId) */
  @Column({ name: 'target_id', length: 100 })
  targetId: string;

  @Column({
    type: 'enum',
    enum: ['love', 'meh', 'no', 'yes', 'maybe'],
  })
  response: VoteResponse;

  @CreateDateColumn({ name: 'voted_at' })
  votedAt: Date;
}
