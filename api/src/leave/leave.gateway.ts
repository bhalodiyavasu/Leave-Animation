import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000', credentials: true },
  namespace: '/leave',
})
export class LeaveGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const role = client.handshake.query.role as string;

    if (userId) client.join(`user_${userId}`);
    if (role === 'Admin') client.join('admins');
  }

  handleDisconnect(client: Socket) {
    client.disconnect();
  }

  emitLeaveUpdate(userId: string, leave: any) {
    this.server.to(`user_${userId}`).emit('leaveUpdate', leave);
    this.server.to('admins').emit('leaveUpdate', leave);
  }

  emitLeaveCreate(leave: any){
    this.server.to('admins').emit('leaveCreate', leave);
  }
}
