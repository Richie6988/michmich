import { Controller, Get, Param, ParseFloatPipe, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VenuesService } from './venues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VenueCategory } from './entities/venue.entity';

@ApiTags('venues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get('venues/near')
  findNear(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
    @Query('category') category?: VenueCategory,
  ) {
    return this.venuesService.findNear(lat, lng, radius ? parseInt(radius, 10) : 1000, category);
  }

  @Get('trips/:tripId/accommodations')
  listAccommodations(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.venuesService.listForTrip(tripId);
  }
}
