import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification, NotificationType, PushSubscription } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(PushSubscription)
    private readonly subRepo: Repository<PushSubscription>,
  ) {}

  async listForUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    return this.notifRepo.find({
      where: unreadOnly ? { userId, read: false } : { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(userId: string, notifId: string): Promise<void> {
    await this.notifRepo.update(
      { id: notifId, userId },
      { read: true, readAt: new Date() },
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifRepo.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );
  }

  async create(
    userId: string, type: NotificationType, title: string, body: string,
    options: { tripId?: string; url?: string } = {},
  ): Promise<Notification> {
    const notif = this.notifRepo.create({
      userId, type, title, body,
      tripId: options.tripId || null,
      url: options.url || null,
      read: false,
    });
    return this.notifRepo.save(notif);
  }

  // ========= Web Push subscriptions =========

  async addSubscription(userId: string, sub: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) {
    // Dedupe by endpoint
    const existing = await this.subRepo.findOne({ where: { endpoint: sub.endpoint } });
    if (existing) {
      existing.userId = userId;
      existing.p256dh = sub.p256dh;
      existing.auth = sub.auth;
      existing.userAgent = sub.userAgent || null;
      return this.subRepo.save(existing);
    }
    const newSub = this.subRepo.create({
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      userAgent: sub.userAgent || null,
    });
    return this.subRepo.save(newSub);
  }

  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    await this.subRepo.delete({ userId, endpoint });
  }

  /**
   * Send a push notification to ALL of a user's registered devices.
   * No-op if web-push lib not configured. Sentinel for now; real wiring in
   * a follow-up wave once VAPID keys are in env.
   */
  async pushToUser(_userId: string, _payload: { title: string; body: string; url?: string }) {
    // TODO: install 'web-push' package and call webpush.sendNotification(sub, JSON.stringify(payload))
    //  - VAPID keys from process.env.VAPID_PUBLIC / VAPID_PRIVATE
    //  - On 410 Gone, delete the subscription
    return { sent: 0 };
  }
}
