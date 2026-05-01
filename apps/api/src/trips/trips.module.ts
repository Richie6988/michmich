import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Trip } from './entities/trip.entity';
import { TripParticipant } from './entities/trip-participant.entity';
import { Task } from './entities/task.entity';
import { TripPhoto } from './entities/trip-photo.entity';
import { FundsRequest, FundsContribution, Reservation, TransportLeg } from './entities/funds.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { JoinController } from './join.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trip, TripParticipant, Task, TripPhoto,
      FundsRequest, FundsContribution, Reservation, TransportLeg,
    ]),
    UsersModule,
  ],
  providers: [TripsService],
  controllers: [TripsController, JoinController],
  exports: [TripsService, TypeOrmModule],
})
export class TripsModule {}
