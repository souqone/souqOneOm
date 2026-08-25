import { Logger } from '@nestjs/common';
import { OnGatewayInit, WebSocketGateway } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class DiagGateway implements OnGatewayInit {
  private readonly logger = new Logger(DiagGateway.name);

  constructor() {
    this.logger.log('[DIAG] DiagGateway instantiated');
  }

  afterInit(_server: Server) {
    this.logger.log('[DIAG] DiagGateway afterInit fired — bare gateway registered successfully');
  }
}
