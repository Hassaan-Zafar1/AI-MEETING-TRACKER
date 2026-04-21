module.exports = (io) => {
  // This runs whenever a new client connects via WebSocket
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Client joins a "room" for a specific meeting
    // Rooms let us broadcast to only the people in that meeting
    socket.on('join:meeting', (meetingId) => {
      socket.join(meetingId);
      console.log(`Socket ${socket.id} joined meeting room: ${meetingId}`);
    });

    // Client leaves a meeting room
    socket.on('leave:meeting', (meetingId) => {
      socket.leave(meetingId);
      console.log(`Socket ${socket.id} left meeting room: ${meetingId}`);
    });

    // Client updates a task status directly via socket
    // (Alternative to the REST API route — instant with no HTTP overhead)
    socket.on('task:statusChange', async ({ taskId, status, meetingId }) => {
      try {
        const ActionItem = require('../models/ActionItem');
        await ActionItem.findByIdAndUpdate(taskId, { status });

        // Broadcast to everyone in the same meeting room EXCEPT the sender
        socket.to(meetingId).emit('task:updated', { taskId, status });
      } catch (error) {
        socket.emit('error', { message: 'Failed to update task' });
      }
    });

    // When client disconnects
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};