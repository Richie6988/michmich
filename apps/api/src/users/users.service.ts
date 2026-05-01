import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, patch: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    // Prevent caller from changing critical fields directly
    delete (patch as any).id;
    delete (patch as any).passwordHash;
    delete (patch as any).email;
    Object.assign(user, patch);
    await this.userRepo.save(user);
    return user;
  }

  async setHomeLocation(id: string, lat: number, lng: number, label?: string) {
    const user = await this.findById(id);
    user.homeLocation = { type: 'Point', coordinates: [lng, lat] };
    if (label !== undefined) user.homeLabel = label;
    await this.userRepo.save(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }
}
