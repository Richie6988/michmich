import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

/**
 * Real-time gateway. Clients connect with a JWT in handshake.auth.token,
 * join per-trip rooms, and broadcast events.
 *
 * Auth (production-grade as of Wave 20):
 *   - On connect, JWT is extracted from handshake.auth.token
 *   - Verified with same secret as HTTP API
 *   - Failed verification disconnects the socket immediately
 *   - userId is attached to socket for later authorization checks
 *
 * Event channels:
 *   trip:{tripId}:chat       new chat message
 *   trip:{tripId}:vote       any vote cast or cleared
 *   trip:{tripId}:task       task created/toggled/assigned/removed
 *   trip:{tripId}:photo      photo added/removed
 *   trip:{tripId}:fund       contribution paid / status changed
 *   trip:{tripId}:zones      equity zones computed
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/realtime',
})
export class TripGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TripGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token
        || (client.handshake.headers.authorization || '').replace(/^Bearer /, '');

      // Allow unauthenticated connections in dev only - prod enforces JWT
      if (!token) {
        if (process.env.NODE_ENV === 'production') {
          this.logger.warn(`Rejecting unauthenticated WebSocket: ${client.id}`);
          client.disconnect(true);
          return;
        }
        this.logger.log(`Anonymous client connected (dev only): ${client.id}`);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'barry-dev-secret',
      });
      // Attach userId to socket for later authorization
      (client as any).userId = payload.sub;
      this.logger.log(`Authenticated client connected: ${client.id} (user: ${payload.sub})`);
    } catch (err) {
      this.logger.warn(`Rejecting invalid JWT WebSocket: ${client.id} - ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_trip')
  handleJoinTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tripId: string },
  ) {
    const room = `trip:${payload.tripId}`;
    client.join(room);
    return { joined: room };
  }

  @SubscribeMessage('leave_trip')
  handleLeaveTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tripId: string },
  ) {
    const room = `trip:${payload.tripId}`;
    client.leave(room);
    return { left: room };
  }

  // ============================================================
  // Helpers - called by services to push updates to subscribers
  // ============================================================

  emitVote(tripId: string, payload: any) {
    this.server?.to(`trip:${tripId}`).emit('vote', payload);
  }

  emitTask(tripId: string, payload: any) {
    this.server?.to(`trip:${tripId}`).emit('task', payload);
  }

  emitPhoto(tripId: string, payload: any) {
    this.server?.to(`trip:${tripId}`).emit('photo', payload);
  }

  emitFund(tripId: string, payload: any) {
    this.server?.to(`trip:${tripId}`).emit('fund', payload);
  }

  emitChat(tripId: string, payload: any) {
    this.server?.to(`trip:${tripId}`).emit('chat', payload);
  }

  emitZones(tripId: string, payload: any) {
    this.server?.to(`trip:${tripId}`).emit('zones', payload);
  }
}
