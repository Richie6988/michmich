import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { UpdateUserDto, SetHomeLocationDto } from './dto/update-user.dto';
import { JwtAuthGuard, CurrentUser } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    return this.sanitize(user);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.update(user.id, dto as any);
    return this.sanitize(updated);
  }

  @Post('me/home-location')
  async setHomeLocation(@CurrentUser() user: User, @Body() dto: SetHomeLocationDto) {
    const updated = await this.usersService.setHomeLocation(user.id, dto.lat, dto.lng, dto.label);
    return this.sanitize(updated);
  }

  private sanitize(user: User) {
    const { passwordHash, googleId, appleId, ...rest } = user;
    return rest;
  }
}
