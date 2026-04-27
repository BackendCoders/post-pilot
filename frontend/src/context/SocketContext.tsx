import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/query/auth.query';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
	socket: Socket | null;
	isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
	socket: null,
	isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const { data: user } = useAuth();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!user) {
			if (socket) {
				socket.disconnect();
				setSocket(null);
			}
			return;
		}

		const socketUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
		const newSocket = io(socketUrl, {
			withCredentials: true,
			transports: ['websocket'],
		});

		newSocket.on('connect', () => {
			console.log('Connected to socket server');
			setIsConnected(true);
			// Join a room
			if (user) {
				newSocket.emit('join_user', user.id);
			}
		});

		newSocket.on('disconnect', () => {
			console.log('Disconnected from socket server');
			setIsConnected(false);
		});

		newSocket.on('new_message', () => {
			// Invalidate queries globally whenever any new message arrives/is sent
			queryClient.invalidateQueries({ queryKey: ['leads'] });
			queryClient.invalidateQueries({ queryKey: ['conversations'] });
			queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
		});

		setSocket(newSocket);

		return () => {
			newSocket.off('new_message');
			newSocket.disconnect();
		};
	}, [user, queryClient]);

	return (
		<SocketContext.Provider value={{ socket, isConnected }}>
			{children}
		</SocketContext.Provider>
	);
};
