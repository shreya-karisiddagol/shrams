import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    const socket = io('http://localhost:5000', {
      auth: { token },
      query: { staffId: user.staffId },
    });

    socket.on('connect', () => console.log('Socket connected'));

    socket.on('new_task', (data) => {
      toast.custom(() => (
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <p className="font-semibold">📋 New Task Assigned</p>
          <p className="text-sm mt-1">{data.title}</p>
        </div>
      ));
    });

    socket.on('critical_alert', (data) => {
      toast.error(`🚨 Critical: ${data.title}`, { duration: 8000 });
    });

    socket.on('reassignment', (data) => {
      toast(`🔄 Task Reassigned: ${data.title}`);
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token, user]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
