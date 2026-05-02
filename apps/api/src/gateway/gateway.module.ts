import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TripGateway } from './trip.gateway';

@Module({
  imports: [
    // Same JWT secret as auth module
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'barry-dev-secret',
    }),
  ],
  providers: [TripGateway],
  exports: [TripGateway],
})
export class GatewayModule {}
