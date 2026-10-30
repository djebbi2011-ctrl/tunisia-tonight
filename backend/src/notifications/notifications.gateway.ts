import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  namespace: '/realtime',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId → userId

  constructor(private jwtService: JwtService, private config: ConfigService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token, { secret: this.config.get('JWT_ACCESS_SECRET') });
      this.connectedUsers.set(client.id, payload.sub);

      // Rejoindre la room personnelle (user:ID) + room rôle
      client.join(`user:${payload.sub}`);
      if (payload.role === 'HOTELIER') client.join(`role:hotelier`);
      if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') client.join(`role:admin`);

      console.log(`[WS] Connecté: ${payload.email} (${payload.role})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  // Rejoindre la room d'un hôtel spécifique (extranet hôtelier)
  @SubscribeMessage('join:hotel')
  handleJoinHotel(@ConnectedSocket() client: Socket, @MessageBody() hotelId: string) {
    client.join(`hotel:${hotelId}`);
    return { event: 'joined', data: `hotel:${hotelId}` };
  }

  // ── ÉMETTEURS UTILISÉS PAR LES SERVICES ──────────────────

  // Notifier l'hôtel d'une nouvelle réservation
  notifyNewReservation(hotelId: string, reservation: any) {
    this.server.to(`hotel:${hotelId}`).emit('reservation:new', {
      type: 'RESERVATION_NEW',
      title: 'Nouvelle réservation',
      message: `Dossier ${reservation.reference} — ${reservation.roomType?.name}`,
      data: reservation,
      timestamp: new Date().toISOString(),
    });
  }

  // Notifier le client de la validation
  notifyClientValidated(clientId: string, reservation: any) {
    this.server.to(`user:${clientId}`).emit('reservation:validated', {
      type: 'RESERVATION_VALIDATED',
      title: 'Réservation confirmée !',
      message: `Votre dossier ${reservation.reference} a été validé par l'hôtel.`,
      data: reservation,
      timestamp: new Date().toISOString(),
    });
  }

  // Notifier le client d'un refus
  notifyClientRefused(clientId: string, reservation: any) {
    this.server.to(`user:${clientId}`).emit('reservation:refused', {
      type: 'RESERVATION_REFUSED',
      title: 'Réservation refusée',
      message: `Votre dossier ${reservation.reference} a été refusé.`,
      data: reservation,
      timestamp: new Date().toISOString(),
    });
  }

  // Notifier l'admin d'une remise accordée
  notifyAdminDiscount(discount: any) {
    this.server.to('role:admin').emit('discount:new', {
      type: 'DISCOUNT_ALERT',
      title: 'Remise accordée',
      message: `Remise ${discount.discountPct}% sur dossier — visible dans le journal admin`,
      data: discount,
      timestamp: new Date().toISOString(),
    });
  }

  // Mise à jour disponibilité en temps réel
  notifyAvailabilityUpdate(hotelId: string, update: any) {
    this.server.to(`hotel:${hotelId}`).emit('availability:update', update);
  }
}
