import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EquityZone, TripPin } from './entities/equity-zone.entity';
import { Trip } from '../trips/entities/trip.entity';

@Injectable()
export class EquityService {
  private readonly logger = new Logger(EquityService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(EquityZone)
    private readonly zoneRepo: Repository<EquityZone>,
    @InjectRepository(TripPin)
    private readonly pinRepo: Repository<TripPin>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
  ) {}

  /**
   * Compute zones by calling the Python equity engine, then persist.
   * Engine endpoint: POST {EQUITY_ENGINE_URL}/optimize
   * Body: { participants: [{lat, lng, mode, time_weight, money_weight}], trip_type, max_zones }
   * Returns: { zones: [{lat, lng, score, label, rank}], computed_in_ms }
   */
  async computeZones(tripId: string): Promise<EquityZone[]> {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['participants'],
    });
    if (!trip) throw new Error('Trip not found');

    const baseUrl = this.config.get<string>('EQUITY_ENGINE_URL') || 'http://localhost:8000';
    const participantPayload = trip.participants
      .filter(p => p.originLocation)
      .map(p => {
        const coords = (p.originLocation as any)?.coordinates || [0, 0];
        return {
          lat: coords[1],
          lng: coords[0],
          mode: p.transportMode || 'transit',
          time_weight: Number(p.timeWeight) || 0.5,
          money_weight: Number(p.moneyWeight) || 0.5,
        };
      });

    if (participantPayload.length === 0) {
      this.logger.warn(`Trip ${tripId}: no participants with origin set`);
      return [];
    }

    let zonesFromEngine: any[] = [];
    try {
      const res = await fetch(`${baseUrl}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: participantPayload,
          trip_type: trip.tripType,
          max_zones: 3,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        throw new Error(`Engine returned ${res.status}`);
      }
      const data = await res.json();
      zonesFromEngine = data.zones || [];
    } catch (err) {
      this.logger.error(`Equity engine call failed for trip ${tripId}:`, err);
      return [];
    }

    // Clear old zones for this trip + insert new ones
    await this.zoneRepo.delete({ tripId });
    const created: EquityZone[] = [];
    for (let i = 0; i < zonesFromEngine.length; i++) {
      const z = zonesFromEngine[i];
      const zone = this.zoneRepo.create({
        tripId,
        label: z.label || `Zone ${i + 1}`,
        center: { type: 'Point', coordinates: [z.lng, z.lat] },
        radiusMeters: z.radius || 500,
        rank: z.rank || i + 1,
        equityScore: Math.round((z.score || 0) * 100),
        metadata: z.metadata || null,
      });
      created.push(await this.zoneRepo.save(zone));
    }
    return created;
  }

  async listZones(tripId: string): Promise<EquityZone[]> {
    return this.zoneRepo.find({
      where: { tripId },
      order: { rank: 'ASC' },
    });
  }

  async lockPin(tripId: string, zoneId: string): Promise<TripPin> {
    // Upsert
    let pin = await this.pinRepo.findOne({ where: { tripId } });
    if (pin) {
      pin.zoneId = zoneId;
      pin.lockedAt = new Date();
    } else {
      pin = this.pinRepo.create({ tripId, zoneId });
    }
    return this.pinRepo.save(pin);
  }

  async getPin(tripId: string): Promise<TripPin | null> {
    return this.pinRepo.findOne({ where: { tripId } });
  }

  /** Health check — used by frontend to know if engine is up */
  async health(): Promise<{ up: boolean; latencyMs?: number }> {
    const baseUrl = this.config.get<string>('EQUITY_ENGINE_URL') || 'http://localhost:8000';
    const t0 = Date.now();
    try {
      const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2000) });
      return { up: res.ok, latencyMs: Date.now() - t0 };
    } catch {
      return { up: false };
    }
  }
}
