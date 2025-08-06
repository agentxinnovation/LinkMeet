const connectedUsers = new Map();
const roomUsers = new Map();

const configureSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    
    socket.on('user-connected', (userData) => {
      connectedUsers.set(socket.id, userData);
      console.log(`👤 User ${userData.name || 'Anonymous'} connected with ID: ${socket.id}`);
    });

    socket.on('join-room', (data) => {
      const { roomId, userId, userName } = data;
      
      const currentRoom = [...socket.rooms].find(room => room !== socket.id);
      if (currentRoom) {
        socket.leave(currentRoom);
        socket.to(currentRoom).emit('user-left', { 
          userId: socket.id, 
          userName: connectedUsers.get(socket.id)?.name || 'Anonymous' 
        });
      }
      
      socket.join(roomId);
      
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      roomUsers.get(roomId).set(socket.id, { userId, userName, socketId: socket.id });
      
      socket.to(roomId).emit('user-joined', { 
        userId: socket.id, 
        userName: userName || 'Anonymous',
        socketId: socket.id
      });
      
      const roomUsersList = Array.from(roomUsers.get(roomId).values());
      socket.emit('room-users', roomUsersList);
      
      console.log(`🏠 User ${userName || socket.id} joined room: ${roomId}`);
    });

    socket.on('leave-room', (data) => {
      const { roomId } = data;
      const currentRoom = [...socket.rooms].find(room => room !== socket.id);
      
      if (currentRoom === roomId) {
        socket.leave(roomId);
        
        if (roomUsers.has(roomId)) {
          const userData = roomUsers.get(roomId).get(socket.id);
          roomUsers.get(roomId).delete(socket.id);
          
          if (roomUsers.get(roomId).size === 0) {
            roomUsers.delete(roomId);
          }
          
          socket.to(roomId).emit('user-left', { 
            userId: socket.id, 
            userName: userData?.userName || 'Anonymous' 
          });
        }
        
        console.log(`🚪 User left room: ${roomId}`);
      }
    });

    socket.on('offer', (data) => {
      const { target, offer, roomId } = data;
      socket.to(target).emit('offer', {
        offer,
        sender: socket.id,
        roomId
      });
      console.log(`📡 Offer sent from ${socket.id} to ${target}`);
    });

    socket.on('answer', (data) => {
      const { target, answer, roomId } = data;
      socket.to(target).emit('answer', {
        answer,
        sender: socket.id,
        roomId
      });
      console.log(`📡 Answer sent from ${socket.id} to ${target}`);
    });

    socket.on('ice-candidate', (data) => {
      const { target, candidate, roomId } = data;
      socket.to(target).emit('ice-candidate', {
        candidate,
        sender: socket.id,
        roomId
      });
    });

    socket.on('ready', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('ready', {
        sender: socket.id,
        roomId
      });
      console.log(`✅ User ${socket.id} is ready in room ${roomId}`);
    });

    socket.on('message', (data) => {
      const { roomId, message, userName } = data;
      const messageData = {
        id: Date.now().toString(),
        message,
        userName: userName || 'Anonymous',
        userId: socket.id,
        timestamp: new Date().toISOString(),
        type: 'TEXT'
      };
      
      io.to(roomId).emit('message', messageData);
      console.log(`💬 Message in room ${roomId}: ${message}`);
    });

    socket.on('typing', (data) => {
      const { roomId, userName } = data;
      socket.to(roomId).emit('typing', { 
        userName: userName || 'Anonymous',
        userId: socket.id 
      });
    });

    socket.on('stop-typing', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('stop-typing', { userId: socket.id });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
      
      for (const [roomId, users] of roomUsers.entries()) {
        if (users.has(socket.id)) {
          const userData = users.get(socket.id);
          users.delete(socket.id);
          
          socket.to(roomId).emit('user-left', { 
            userId: socket.id, 
            userName: userData?.userName || 'Anonymous' 
          });
          
          if (users.size === 0) {
            roomUsers.delete(roomId);
          }
        }
      }
      
      connectedUsers.delete(socket.id);
    });
  });
};

module.exports = {
  configureSocket,
  connectedUsers,
  roomUsers
};