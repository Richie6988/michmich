import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

export type VenueCategory = 'restaurant' | 'bar' | 'hotel' | 'activity' | 'museum' | 'park' | 'other';

@Entity('venues')
@Index(['osmId'], { unique: true })
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'osm_id', length: 100, nullable: true, unique: true })
  osmId: string | null;

  @Column({ length: 200 })
  name: string;

  @Column({
    type: 'enum',
    enum: ['restaurant', 'bar', 'hotel', 'activity', 'museum', 'park', 'other'],
  })
  category: VenueCategory;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: any;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'int', nullable: true })
  price: number | null;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating: number | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('trip_accommodations')
@Index(['tripId'])
export class Accommodation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({
    type: 'enum',
    enum: ['hotel', 'bnb', 'airbnb', 'hostel'],
    default: 'hotel',
  })
  type: 'hotel' | 'bnb' | 'airbnb' | 'hostel';

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'price_per_night', type: 'decimal', precision: 10, scale: 2 })
  pricePerNight: number;

  @Column({ type: 'int', default: 1 })
  nights: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'int', default: 1 })
  rooms: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating: number | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'boolean', default: false })
  selected: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
