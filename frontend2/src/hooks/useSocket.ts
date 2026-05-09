import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

// Custom hook to manage Socket.IO connection
export const useSocket = () => {
  // useRef persists the socket across renders without causing re-renders
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Connect to the Socket.IO server
    socketRef.current = io(SOCKET_URL, {
      // Send JWT token for authentication
      auth: { token: user.token },
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current?.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Cleanup: disconnect when component unmounts or user logs out
    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  return socketRef.current;
};