import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Load env from repo root
loadEnv({ path: resolve(__dirname, '../../../.env') });
loadEnv({ path: resolve(__dirname, '../.env') });

import { User } from './users/entities/user.entity';
import { Trip } from './trips/entities/trip.entity';
import { TripParticipant } from './trips/entities/trip-participant.entity';
import { Task } from './trips/entities/task.entity';
import { TripPhoto } from './trips/entities/trip-photo.entity';
import {
  FundsRequest, FundsContribution, Reservation, TransportLeg,
} from './trips/entities/funds.entity';
import { Vote } from './votes/entities/vote.entity';
import { DatePoll, DatePollOption } from './votes/entities/date-poll.entity';
import { EquityZone, TripPin } from './equity/entities/equity-zone.entity';
import { Venue, Accommodation } from './venues/entities/venue.entity';
import { Notification, PushSubscription } from './notifications/entities/notification.entity';

/**
 * DataSource used by the TypeORM CLI for generating + running migrations.
 *
 * Run migrations:
 *   pnpm typeorm migration:generate -d apps/api/src/data-source.ts <Name>
 *   pnpm typeorm migration:run -d apps/api/src/data-source.ts
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : (process.env.PGHOST || 'localhost'),
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.PGPORT || '5433', 10),
  username: process.env.DATABASE_URL ? undefined : (process.env.PGUSER || 'barry'),
  password: process.env.DATABASE_URL ? undefined : (process.env.PGPASSWORD || 'barry_dev'),
  database: process.env.DATABASE_URL ? undefined : (process.env.PGDATABASE || 'barry'),
  entities: [
    User,
    Trip, TripParticipant, Task, TripPhoto,
    FundsRequest, FundsContribution, Reservation, TransportLeg,
    Vote, DatePoll, DatePollOption,
    EquityZone, TripPin,
    Venue, Accommodation,
    Notification, PushSubscription,
  ],
  migrations: ['apps/api/src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
