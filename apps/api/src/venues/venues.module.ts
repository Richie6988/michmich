import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Venue, Accommodation } from './entities/venue.entity';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Venue, Accommodation])],
  providers: [VenuesService],
  controllers: [VenuesController],
  exports: [VenuesService],
})
export class VenuesModule {}
