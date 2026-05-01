import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Trip } from './trip.entity';
import { User } from '../../users/entities/user.entity';

@Entity('trip_photos')
@Index(['tripId'])
export class TripPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid' })
  tripId: string;

  @ManyToOne(() => Trip, t => t.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;

  @Column({ type: 'text', nullable: true })
  caption: string | null;

  @Column({ name: 'uploaded_by_id', type: 'uuid' })
  uploadedById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @Column({ name: 'uploaded_by_name', length: 100, nullable: true })
  uploadedByName: string | null;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
