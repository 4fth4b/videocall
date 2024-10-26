const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', (roomId) => {
    console.log(`${socket.id} joined room ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', socket.id);

    socket.on('signal', (data) => {
      console.log(`Relaying signal from ${socket.id} to ${data.userId}`);
      io.to(data.userId).emit('signal', { signal: data.signal, userId: socket.id });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.id} disconnected`);
      socket.to(roomId).emit('user-disconnected', socket.id);
    });
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
