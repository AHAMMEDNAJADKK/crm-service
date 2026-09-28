const { getQueueStatus } = require('../services/queueService');

function initQueueSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket.io: ${socket.id}`);

    // Join queue tracking room
    socket.on('join:queue', async () => {
      socket.join('queue');
      console.log(`📡 Socket client ${socket.id} joined 'queue' room`);
      
      // Immediately push latest status
      try {
        const queueStatus = await getQueueStatus();
        socket.emit('queue:update', queueStatus);
      } catch (err) {
        console.error('Failed to emit initial queue status:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = initQueueSocket;
