import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EquityZone, TripPin } from './entities/equity-zone.entity';
import { Trip } from '../trips/entities/trip.entity';
import { EquityService } from './equity.service';
import { EquityController } from './equity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EquityZone, TripPin, Trip])],
  providers: [EquityService],
  controllers: [EquityController],
  exports: [EquityService],
})
export class EquityModule {}
