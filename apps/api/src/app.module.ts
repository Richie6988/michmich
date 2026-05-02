import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { VenuesModule } from './venues/venues.module';
import { VotesModule } from './votes/votes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GatewayModule } from './gateway/gateway.module';
import { EquityModule } from './equity/equity.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Rate limiting: 3 tiers
    // - short: 10 req/sec  (burst protection)
    // - medium: 100 req/min (general API use)
    // - long: 1000 req/hour (overall daily quota)
    // Auth endpoints get a stricter @Throttle() decorator override.
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 100 },
      { name: 'long', ttl: 3_600_000, limit: 1000 },
    ]),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false, // We use SQL migrations
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    TripsModule,
    VenuesModule,
    VotesModule,
    EquityModule,
    NotificationsModule,
    GatewayModule,
  ],
  providers: [
    // Global rate-limit guard - applies ThrottlerModule limits to every endpoint
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
