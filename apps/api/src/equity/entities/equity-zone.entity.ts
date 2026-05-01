import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

@Entity('equity_zones')
@Index(['tripId'])
export class EquityZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ length: 100, nullable: true })
  label: string | null;

  @Column({
    name: 'center',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  center: any;

  @Column({ name: 'radius_meters', type: 'int', default: 500 })
  radiusMeters: number;

  @Column({ type: 'int' })
  rank: number;

  @Column({ name: 'equity_score', type: 'int', default: 0 })
  equityScore: number;

  /** Cached snapshot from the equity engine (per-participant burdens, fairness metrics) */
  @Column({ type: 'jsonb', nullable: true })
  metadata: any | null;

  @CreateDateColumn({ name: 'computed_at' })
  computedAt: Date;
}

/**
 * Final pin lock — once the group has voted on zones, the winning one gets
 * persisted here. One row per trip max.
 */
@Entity('trip_pins')
@Index(['tripId'], { unique: true })
export class TripPin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid', unique: true })
  tripId: string;

  @Column({ name: 'zone_id', type: 'uuid' })
  zoneId: string;

  @CreateDateColumn({ name: 'locked_at' })
  lockedAt: Date;
}
