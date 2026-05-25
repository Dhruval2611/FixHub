import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export const connectSocket = (vendor) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    // Join vendor-specific rooms
    if (vendor) {
      const vendorId = vendor._id || vendor.id;
      socket.emit('vendor-join', {
        vendorId: vendorId,
        category: vendor.serviceCategory,
        location: vendor.location,
      });
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
