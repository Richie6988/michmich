import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TripsService } from './trips.service';

@ApiTags('join')
@Controller('join')
export class JoinController {
  constructor(private readonly tripsService: TripsService) {}

  @Get(':token')
  async lookup(@Param('token') token: string) {
    const trip = await this.tripsService.findByInviteToken(token);
    if (!trip) throw new NotFoundException('Invite not found or expired');
    // Public preview: only what's needed for the join modal
    return {
      id: trip.id,
      name: trip.name,
      mode: trip.mode,
      scheduledAt: trip.scheduledAt,
      endDate: trip.endDate,
      organizer: trip.organizer
        ? { firstName: trip.organizer.firstName, avatarUrl: trip.organizer.avatarUrl }
        : null,
      participantCount: trip.participants.length,
      participants: trip.participants.map(p => ({
        id: p.id,
        firstName: p.user?.firstName || p.guestName,
        avatarUrl: p.user?.avatarUrl,
      })),
    };
  }
}
