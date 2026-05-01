import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Vote } from './entities/vote.entity';
import { DatePoll, DatePollOption } from './entities/date-poll.entity';
import { Trip } from '../trips/entities/trip.entity';
import { VotesService } from './votes.service';
import { VotesController, DatePollController } from './votes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, DatePoll, DatePollOption, Trip])],
  providers: [VotesService],
  controllers: [VotesController, DatePollController],
  exports: [VotesService],
})
export class VotesModule {}
