import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TripParticipant } from './trip-participant.entity';
import { Vote } from '../../votes/entities/vote.entity';
import { Task } from './task.entity';
import { TripPhoto } from './trip-photo.entity';

export type TripType = 'dinner' | 'weekend' | 'evg' | 'evjf' | 'family' | 'corporate' | 'custom';
export type TripStatus = 'draft' | 'inviting' | 'constraints' | 'calculating' | 'voting' | 'booked' | 'completed' | 'cancelled';
export type TripMode = 'wanderlust' | 'trip';

@Entity('trips')
@Index(['organizerId'])
@Index(['status'])
@Index(['inviteToken'], { unique: true })
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'organizer_id', type: 'uuid' })
  organizerId: string;

  @ManyToOne(() => User, u => u.organizedTrips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column({
    name: 'trip_type',
    type: 'enum',
    enum: ['dinner', 'weekend', 'evg', 'evjf', 'family', 'corporate', 'custom'],
    default: 'custom',
  })
  tripType: TripType;

  @Column({
    type: 'enum',
    enum: ['wanderlust', 'trip'],
    default: 'wanderlust',
    nullable: true,
  })
  mode: TripMode;

  @Column({
    type: 'enum',
    enum: ['draft', 'inviting', 'constraints', 'calculating', 'voting', 'booked', 'completed', 'cancelled'],
    default: 'draft',
  })
  status: TripStatus;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ name: 'stealth_mode', type: 'boolean', default: false })
  stealthMode: boolean;

  @Column({ name: 'max_time_budget', type: 'int', nullable: true })
  maxTimeBudget: number | null;

  @Column({ name: 'max_money_budget', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxMoneyBudget: number | null;

  @Column({ name: 'invite_token', type: 'varchar', length: 64, unique: true })
  inviteToken: string;

  @Column({ name: 'selected_venue_id', type: 'uuid', nullable: true })
  selectedVenueId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => TripParticipant, p => p.trip, { cascade: true })
  participants: TripParticipant[];

  @OneToMany(() => Vote, v => v.trip)
  votes: Vote[];

  @OneToMany(() => Task, t => t.trip)
  tasks: Task[];

  @OneToMany(() => TripPhoto, p => p.trip)
  photos: TripPhoto[];
}
