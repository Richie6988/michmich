import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type NotificationType =
  | 'invite' | 'constraint_reminder' | 'vote_start' | 'vote_reminder'
  | 'booking_confirmed' | 'trip_update' | 'system'
  | 'poll_vote' | 'new_task' | 'task_added' | 'funding_milestone' | 'new_message';

@Entity('notifications')
@Index(['userId', 'read'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: [
      'invite', 'constraint_reminder', 'vote_start', 'vote_reminder',
      'booking_confirmed', 'trip_update', 'system',
      'poll_vote', 'new_task', 'task_added', 'funding_milestone', 'new_message',
    ],
  })
  type: NotificationType;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'trip_id', type: 'uuid', nullable: true })
  tripId: string | null;

  @Column({ length: 500, nullable: true })
  url: string | null;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('push_subscriptions')
@Index(['userId'])
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 500 })
  endpoint: string;

  @Column({ length: 200 })
  p256dh: string;

  @Column({ length: 200 })
  auth: string;

  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
