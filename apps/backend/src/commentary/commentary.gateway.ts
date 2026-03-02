import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class CommentaryGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommentaryGateway.name);

  @SubscribeMessage('joinStore')
  handleJoinStore(
    @MessageBody() storeId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `store:${storeId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  emitCommentaryUpdated(storeId: string, payload: Record<string, unknown>) {
    const room = `store:${storeId}`;
    this.server.to(room).emit('commentary:updated', payload);
    this.logger.log(`Emitted commentary:updated to room ${room}`);
  }
}
