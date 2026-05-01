import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { NotificationsService } from './notifications.service';
import { JwtAuthGuard, CurrentUser } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

class SubscribePushDto {
  @IsString() endpoint: string;
  @IsString() p256dh: string;
  @IsString() auth: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: User,
    @Query('unread') unread?: string,
  ) {
    return this.service.listForUser(user.id, unread === 'true');
  }

  @Patch(':id/read')
  @HttpCode(204)
  async markRead(@CurrentUser() user: User, @Param('id') id: string) {
    await this.service.markRead(user.id, id);
  }

  @Patch('read-all')
  @HttpCode(204)
  async markAllRead(@CurrentUser() user: User) {
    await this.service.markAllRead(user.id);
  }

  // ========= Push subscriptions =========

  @Post('subscriptions')
  @HttpCode(201)
  subscribe(@CurrentUser() user: User, @Body() dto: SubscribePushDto) {
    return this.service.addSubscription(user.id, dto);
  }

  @Delete('subscriptions')
  @HttpCode(204)
  async unsubscribe(@CurrentUser() user: User, @Body('endpoint') endpoint: string) {
    await this.service.removeSubscription(user.id, endpoint);
  }
}
