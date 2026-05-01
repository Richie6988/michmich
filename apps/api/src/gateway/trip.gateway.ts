import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * Real-time gateway. Clients connect, join per-trip rooms, and broadcast events
 * (chat messages, votes cast, task added/toggled, photo added, fund paid).
 *
 * Auth: client passes JWT in handshake.auth.token. We verify in connect handler.
 * For now we accept any connection in dev; production should enforce JWT verification.
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

  handleConnection(client: Socket) {
    // TODO: verify JWT from client.handshake.auth.token in production
    this.logger.log(`Client connected: ${client.id}`);
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
  // Helpers — called by services to push updates to subscribers
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
