import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, Index,
} from 'typeorm';
import { TripParticipant } from '../trips/entities/trip-participant.entity';
import { Trip } from '../trips/entities/trip.entity';
import { Vote } from '../votes/entities/vote.entity';

export type TransportMode = 'walk' | 'bike' | 'transit' | 'car' | 'train' | 'flight';
export type SubscriptionTier = 'free' | 'pro';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', nullable: true, length: 255 })
  passwordHash: string | null;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ length: 20, nullable: true })
  phone: string | null;

  @Column({ length: 5, default: 'en' })
  locale: string;

  // Default preferences (used as setup defaults on every Barry)
  @Column({
    name: 'default_transport_mode',
    type: 'enum',
    enum: ['walk', 'bike', 'transit', 'car', 'train', 'flight'],
    default: 'transit',
  })
  defaultTransportMode: TransportMode;

  @Column({ name: 'default_time_weight', type: 'decimal', precision: 3, scale: 2, default: 0.50 })
  defaultTimeWeight: number;

  @Column({ name: 'default_money_weight', type: 'decimal', precision: 3, scale: 2, default: 0.50 })
  defaultMoneyWeight: number;

  // Stored as PostGIS geography(POINT,4326). We expose lat/lng in the service layer.
  @Column({
    name: 'home_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  homeLocation: any | null;

  @Column({ name: 'home_label', type: 'text', nullable: true })
  homeLabel: string | null;

  // Subscription
  @Column({
    name: 'subscription_tier',
    type: 'enum',
    enum: ['free', 'pro'],
    default: 'free',
  })
  subscriptionTier: SubscriptionTier;

  @Column({ name: 'subscription_expires_at', type: 'timestamptz', nullable: true })
  subscriptionExpiresAt: Date | null;

  // OAuth
  @Column({ name: 'google_id', length: 255, nullable: true })
  googleId: string | null;

  @Column({ name: 'apple_id', length: 255, nullable: true })
  appleId: string | null;

  // Travel preferences (saved defaults reused on every setup)
  @Column({ name: 'default_max_time', type: 'int', nullable: true })
  defaultMaxTime: number | null;

  @Column({ name: 'default_max_time_unit', length: 10, nullable: true })
  defaultMaxTimeUnit: string | null;

  @Column({ name: 'default_max_budget', type: 'decimal', precision: 10, scale: 2, nullable: true })
  defaultMaxBudget: number | null;

  @Column({ name: 'default_max_budget_currency', length: 3, nullable: true })
  defaultMaxBudgetCurrency: string | null;

  @Column({ name: 'default_email', length: 255, nullable: true })
  defaultEmail: string | null;

  @Column({ name: 'default_self_book', type: 'boolean', default: false })
  defaultSelfBook: boolean;

  @Column({ name: 'default_reduction_cards', type: 'jsonb', default: () => "'[]'::jsonb" })
  defaultReductionCards: any[];

  @Column({ length: 20, default: 'auto' })
  theme: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Trip, trip => trip.organizer)
  organizedTrips: Trip[];

  @OneToMany(() => TripParticipant, p => p.user)
  participations: TripParticipant[];

  @OneToMany(() => Vote, v => v.user)
  votes: Vote[];
}
