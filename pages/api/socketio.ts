import { Server } from 'socket.io';

const ioHandler = (req: any, res: any) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    
    io.on('connection', socket => {
      socket.on('taskUpdate', async (data) => {
        // Broadcast para todos os clientes exceto o emissor
        socket.broadcast.emit('taskUpdated', data);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler; 