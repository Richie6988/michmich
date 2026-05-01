import {
  Injectable, ConflictException, UnauthorizedException, BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';

import { User } from '../users/entities/user.entity';
import { SignupDto, LoginDto } from './dto/auth.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<{ accessToken: string; user: User }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account already exists for this email');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || null,
      locale: dto.locale || 'en',
    });
    await this.userRepo.save(user);

    const accessToken = this.signToken(user);
    return { accessToken, user };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: User }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Wrong email or password');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Wrong email or password');
    }

    const accessToken = this.signToken(user);
    return { accessToken, user };
  }

  async forgotPassword(email: string): Promise<{ ok: boolean }> {
    // Always return ok to avoid disclosing whether the email exists
    const user = await this.userRepo.findOne({ where: { email } });
    if (user) {
      // TODO: enqueue email send with reset link via NotificationsModule
      // For now we just succeed silently
      void user;
    }
    return { ok: true };
  }

  /**
   * Validate a user (used internally by JWT strategy and OAuth flows)
   */
  async validateUserById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  /**
   * Used by guest-mode flows where there's no real account.
   * Generates a short-lived token tied to a guest payload.
   */
  signGuestToken(guestName: string): { accessToken: string; guest: { name: string } } {
    const accessToken = this.jwtService.sign(
      { sub: 'guest', name: guestName, isGuest: true },
      { expiresIn: '7d' },
    );
    return { accessToken, guest: { name: guestName } };
  }

  private signToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
