import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (roomName, onEventReceived, eventName = 'queue:update') => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomName) return;

    // Connect to Backend Socket Server
    socketRef.current = io(window.location.origin || 'http://localhost:5000', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log(`📡 Connected to Socket server. Joining room: ${roomName}`);
      if (roomName === 'queue') {
        socketRef.current.emit('join:queue');
      } else {
        socketRef.current.emit('join:queue'); // Fallback/default room
      }
    });

    // Dynamic event registration
    socketRef.current.on(eventName, (data) => {
      if (onEventReceived) {
        onEventReceived(data);
      }
    });

    // Also listen for helper alert status updates
    socketRef.current.on('job:statusChange', (data) => {
      console.log('⚡ Status Transition:', data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log(`🔌 Disconnected from Socket room: ${roomName}`);
      }
    };
  }, [roomName, onEventReceived, eventName]);

  return socketRef.current;
};

export default useSocket;
