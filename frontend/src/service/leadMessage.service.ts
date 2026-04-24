import { api } from './api';

export interface LeadMessage {
  _id: string;
  lead: string;
  user: string;
  phone: string;
  direction: 'outgoing' | 'incoming';
  content: string;
  contentType: 'text' | 'document' | 'image';
  status: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  lastMessage: LeadMessage;
  leadInfo: {
    _id: string;
    title: string;
    phone: string;
    website?: string;
    thumbnailUrl?: string;
    status: string;
    category?: string;
    categoryName?: string;
  };
}

export const getConversations = async (): Promise<Conversation[]> => {
  const response = await api.get('/api/leads/messages');
  return response.data;
};

export const getUnreadCount = async (): Promise<{ unreadCount: number }> => {
  const response = await api.get('/api/leads/messages/unread');
  return response.data;
};

export const getThread = async (leadId: string): Promise<LeadMessage[]> => {
  const response = await api.get(`/api/leads/messages/${leadId}`);
  return response.data;
};

export const sendReply = async (leadId: string, text: string): Promise<void> => {
  await api.post(`/api/leads/messages/${leadId}/reply`, { text });
};

export const markAsRead = async (leadId: string): Promise<void> => {
  await api.patch(`/api/leads/messages/${leadId}/read`);
};
