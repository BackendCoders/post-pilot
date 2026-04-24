import { Server } from 'socket.io';
import { logger } from '../utils/logger';

class SocketService {
  private io: Server | null = null;

  init(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Customize this in production
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      logger.info('New socket client connected', { socketId: socket.id });

      socket.on('join_lead_chat', (leadId: string) => {
        socket.join(`lead_${leadId}`);
        logger.info('Client joined lead chat room', { leadId, socketId: socket.id });
      });

      socket.on('join_user', (userId: string) => {
        socket.join(`user_${userId}`);
        logger.info('Client joined user room', { userId, socketId: socket.id });
      });

      socket.on('leave_lead_chat', (leadId: string) => {
        socket.leave(`lead_${leadId}`);
        logger.info('Client left lead chat room', { leadId, socketId: socket.id });
      });

      socket.on('disconnect', () => {
        logger.info('Socket client disconnected', { socketId: socket.id });
      });
    });

    return this.io;
  }

  emitToLeadChat(leadId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`lead_${leadId}`).emit(event, data);
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      // Assuming users join a room named after their userId
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }
}

export const socketService = new SocketService();
