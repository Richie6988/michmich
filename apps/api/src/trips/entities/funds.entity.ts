import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { User } from '../../users/entities/user.entity';
import { TransportMode } from '../../users/entities/user.entity';

export type FundsStatus = 'collecting' | 'complete' | 'cancelled';
export type ContributionStatus = 'pending' | 'paid' | 'refunded';

@Entity('funds_requests')
@Index(['tripId'], { unique: true })
export class FundsRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid', unique: true })
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['collecting', 'complete', 'cancelled'],
    default: 'collecting',
  })
  status: FundsStatus;

  @Column({ type: 'jsonb' })
  breakdown: { venues: number; accommodation: number; transport: number; activities?: number };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => FundsContribution, c => c.request, { cascade: true })
  contributions: FundsContribution[];
}

@Entity('funds_contributions')
@Index(['requestId'])
@Index(['userId'])
export class FundsContribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  @ManyToOne(() => FundsRequest, r => r.contributions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: FundsRequest;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'user_name', length: 100, nullable: true })
  userName: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  })
  status: ContributionStatus;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  /** stripe_charge_id, balance_tx_id, etc. */
  @Column({ name: 'payment_reference', length: 200, nullable: true })
  paymentReference: string | null;

  @Column({ name: 'used_balance', type: 'boolean', default: false })
  usedBalance: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('reservations')
@Index(['tripId'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({
    type: 'enum',
    enum: ['venue', 'accommodation', 'transport'],
  })
  type: 'venue' | 'accommodation' | 'transport';

  @Column({ length: 200 })
  reference: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  })
  status: 'pending' | 'confirmed' | 'cancelled';

  @Column({ name: 'confirmation_code', length: 100, nullable: true })
  confirmationCode: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('transport_legs')
@Index(['tripId'])
@Index(['userId'])
export class TransportLeg {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['walk', 'bike', 'transit', 'car', 'train', 'flight'],
  })
  mode: TransportMode;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ type: 'int', nullable: true })
  distance: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column({ type: 'jsonb', nullable: true })
  geometry: any | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
