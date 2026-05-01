import { Body, Controller, Get, Post, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { SignupDto, LoginDto, ForgotPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard, CurrentUser } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  async signup(@Body() dto: SignupDto) {
    const { accessToken, user } = await this.authService.signup(dto);
    return { accessToken, user: this.sanitize(user) };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const { accessToken, user } = await this.authService.login(dto);
    return { accessToken, user: this.sanitize(user) };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: User) {
    return this.sanitize(user);
  }

  /** Strip sensitive fields before sending to client */
  private sanitize(user: User) {
    const { passwordHash, googleId, appleId, ...rest } = user;
    return rest;
  }
}
