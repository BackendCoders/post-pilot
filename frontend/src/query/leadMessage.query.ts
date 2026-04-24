import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as leadMessageService from '../service/leadMessage.service';
import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: leadMessageService.getConversations,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: leadMessageService.getUnreadCount,
    refetchInterval: 30000, // Poll as fallback, but socket will invalidate it
  });
};

export const useMessageThread = (leadId: string) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !leadId) return;

    socket.emit('join_lead_chat', leadId);

    const handleNewMessage = (message: any) => {
      if (message.lead === leadId) {
        // Update the thread cache with deduplication
        queryClient.setQueryData(['messageThread', leadId], (oldData: any) => {
          if (!oldData) return [message];
          // Check if message already exists
          const exists = oldData.some((m: any) => m._id === message._id);
          if (exists) return oldData;
          
          const newData = [...oldData, message];
          // Keep only last 50
          return newData.slice(-50);
        });
      }
      
      // Also invalidate conversations list and unread count
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_lead_chat', leadId);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, leadId, queryClient]);

  return useQuery({
    queryKey: ['messageThread', leadId],
    queryFn: () => leadMessageService.getThread(leadId),
    enabled: !!leadId,
  });
};

export const useSendReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, text }: { leadId: string; text: string }) =>
      leadMessageService.sendReply(leadId, text),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['messageThread', leadId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => leadMessageService.markAsRead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};
