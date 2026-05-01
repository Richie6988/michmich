import { Module } from '@nestjs/common';
import { TripGateway } from './trip.gateway';

@Module({
  providers: [TripGateway],
  exports: [TripGateway],
})
export class GatewayModule {}
