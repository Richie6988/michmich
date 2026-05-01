import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

export type DatePollStatus = 'open' | 'closed';

@Entity('date_polls')
@Index(['tripId'], { unique: true })
export class DatePoll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'uuid', unique: true })
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({
    type: 'enum',
    enum: ['open', 'closed'],
    default: 'open',
  })
  status: DatePollStatus;

  @Column({ name: 'selected_option_id', type: 'uuid', nullable: true })
  selectedOptionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => DatePollOption, opt => opt.poll, { cascade: true })
  options: DatePollOption[];
}

@Entity('date_poll_options')
@Index(['pollId'])
export class DatePollOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'poll_id', type: 'uuid' })
  pollId: string;

  @ManyToOne(() => DatePoll, p => p.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poll_id' })
  poll: DatePoll;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'int', default: 0 })
  score: number;
}
