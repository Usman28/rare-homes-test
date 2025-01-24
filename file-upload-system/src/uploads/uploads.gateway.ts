// src/uploads/uploads.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust this as per your security requirements
  },
})
export class UploadsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  sendProgress(clientId: string, progress: number) {
    if (this.server.sockets.sockets.get(clientId)) {
      this.server.to(clientId).emit('uploadProgress', { progress });
    } else {
      console.warn(`Attempted to send progress to non-existent client: ${clientId}`);
    }
  }

  sendError(clientId: string, message: string) {
    if (this.server.sockets.sockets.get(clientId)) {
      this.server.to(clientId).emit('uploadError', { message });
    } else {
      console.warn(`Attempted to send error to non-existent client: ${clientId}`);
    }
  }
}
