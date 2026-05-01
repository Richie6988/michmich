import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

import { EquityService } from './equity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class LockPinDto {
  @IsUUID() zoneId: string;
}

@ApiTags('equity')
@Controller()
export class EquityController {
  constructor(private readonly equityService: EquityService) {}

  @Get('equity/health')
  health() {
    return this.equityService.health();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('trips/:tripId/zones')
  list(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.equityService.listZones(tripId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('trips/:tripId/zones/compute')
  compute(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.equityService.computeZones(tripId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('trips/:tripId/pin')
  getPin(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.equityService.getPin(tripId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('trips/:tripId/pin/lock')
  lockPin(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: LockPinDto,
  ) {
    return this.equityService.lockPin(tripId, dto.zoneId);
  }
}
