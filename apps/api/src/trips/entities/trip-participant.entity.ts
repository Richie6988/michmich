import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index, Unique,
} from 'typeorm';
import { Trip } from './trip.entity';
import { User } from '../../users/entities/user.entity';
import { TransportMode } from '../../users/entities/user.entity';

export type ParticipantStatus = 'invited' | 'accepted' | 'declined' | 'constraints_set' | 'voted';

@Entity('trip_participants')
@Unique(['tripId', 'userId'])
@Index(['tripId'])
@Index(['userId'])
export class TripParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, t => t.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, u => u.participations, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  /** Display name fallback when participant has no user account (invited by name) */
  @Column({ name: 'guest_name', length: 100, nullable: true })
  guestName: string | null;

  @Column({
    type: 'enum',
    enum: ['invited', 'accepted', 'declined', 'constraints_set', 'voted'],
    default: 'invited',
  })
  status: ParticipantStatus;

  // Setup (constraints) — populated once user runs through SetupSheet
  @Column({
    name: 'transport_mode',
    type: 'enum',
    enum: ['walk', 'bike', 'transit', 'car', 'train', 'flight'],
    nullable: true,
  })
  transportMode: TransportMode | null;

  @Column({ name: 'time_weight', type: 'decimal', precision: 3, scale: 2, default: 0.50 })
  timeWeight: number;

  @Column({ name: 'money_weight', type: 'decimal', precision: 3, scale: 2, default: 0.50 })
  moneyWeight: number;

  @Column({ name: 'max_time', type: 'int', nullable: true })
  maxTime: number | null;

  @Column({ name: 'max_time_unit', length: 10, nullable: true })
  maxTimeUnit: string | null;

  @Column({ name: 'max_money', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxMoney: number | null;

  @Column({ name: 'max_money_currency', length: 3, nullable: true })
  maxMoneyCurrency: string | null;

  @Column({ length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'self_book', type: 'boolean', default: false })
  selfBook: boolean;

  @Column({ name: 'reduction_cards', type: 'jsonb', default: () => "'[]'::jsonb" })
  reductionCards: any[];

  // Origin (where they leave from for this trip)
  @Column({
    name: 'origin_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  originLocation: any | null;

  @Column({ name: 'origin_label', type: 'text', nullable: true })
  originLabel: string | null;

  // Computed fields filled by equity engine
  @Column({ name: 'burden_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  burdenScore: number | null;

  @Column({ name: 'route_duration', type: 'int', nullable: true })
  routeDuration: number | null;

  @Column({ name: 'route_distance', type: 'int', nullable: true })
  routeDistance: number | null;

  @Column({ name: 'route_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  routeCost: number | null;

  @Column({ name: 'route_geometry', type: 'jsonb', nullable: true })
  routeGeometry: any | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
