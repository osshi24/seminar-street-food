import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PresenceRole, PresenceService } from './presence.service';

interface JwtPayload {
  sub?: string;
  role?: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/presence',
})
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PresenceGateway.name);

  constructor(
    private readonly presence: PresenceService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    const declaredRole = (client.handshake.auth?.role ||
      client.handshake.query?.role) as string | undefined;

    let role: PresenceRole = 'anonymous';
    let userId: string | null = null;

    if (token) {
      const decoded = this.tryDecode(token);
      if (decoded) {
        role =
          this.normalizeRole(decoded.payload.role) ??
          decoded.inferredRole ??
          this.normalizeRole(declaredRole) ??
          'anonymous';
        userId = decoded.payload.sub ?? null;
      }
    } else if (declaredRole) {
      role = this.normalizeRole(declaredRole) ?? 'anonymous';
    }

    this.presence.add({
      socketId: client.id,
      userId,
      role,
      connectedAt: new Date(),
    });
    this.logger.debug(
      `presence connect ${client.id} role=${role} user=${userId ?? '-'}`,
    );
  }

  handleDisconnect(client: Socket): void {
    this.presence.remove(client.id);
    this.logger.debug(`presence disconnect ${client.id}`);
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) return authToken;
    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    const queryToken = client.handshake.query?.token as string | undefined;
    return queryToken ?? null;
  }

  private tryDecode(
    token: string,
  ): { payload: JwtPayload; inferredRole: PresenceRole | null } | null {
    const candidates: Array<{ secret: string | undefined; role: PresenceRole }> = [
      { secret: this.configService.get<string>('JWT_ADMIN_SECRET'), role: 'admin' },
      { secret: this.configService.get<string>('JWT_SECRET'), role: 'store_owner' },
      { secret: this.configService.get<string>('CUSTOMER_JWT_SECRET'), role: 'customer' },
    ];

    for (const { secret, role } of candidates) {
      if (!secret) continue;
      try {
        const payload = this.jwtService.verify<JwtPayload>(token, { secret });
        return { payload, inferredRole: role };
      } catch {
        continue;
      }
    }
    return null;
  }

  private normalizeRole(role: string | undefined | null): PresenceRole | null {
    if (!role) return null;
    const r = role.toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'store_owner' || r === 'store-owner' || r === 'owner')
      return 'store_owner';
    if (r === 'customer') return 'customer';
    return null;
  }
}
