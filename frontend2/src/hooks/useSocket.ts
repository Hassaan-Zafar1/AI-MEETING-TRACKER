import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

// Custom hook to manage Socket.IO connection
// Uses useState instead of useRef so components re-render when the socket connects
export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Connect to the Socket.IO server
    const newSocket = io(SOCKET_URL, {
      // Send JWT token for authentication
      auth: { token: user.token },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      // Trigger re-render so components get the live socket instance
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocket(null);
    });

    // Cleanup: disconnect when component unmounts or user logs out
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user]);

  return socket;
};