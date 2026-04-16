import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/service/api';
import { toast } from 'sonner';

export interface WhatsAppStatus {
	state: 'DISCONNECTED' | 'AWAITING_SCAN' | 'CONNECTED';
	qr?: string | null;
	phoneNumber?: string;
	connectedAt?: string;
}

export const useWhatsAppStatus = () => {
	return useQuery<WhatsAppStatus>({
		queryKey: ['whatsapp', 'status'],
		queryFn: () => api.get('/api/whatsapp/status').then((res) => res.data.data),
		refetchInterval: 3000, // Poll every 3 seconds
	});
};

export const useWhatsAppStart = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => api.post('/api/whatsapp/start'),
		onSuccess: () => {
			// Force an immediate refetch of the status to quickly show the QR code when ready
			queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] });
		},
	});
};

export const useWhatsappSendMessagebulk = () => {
	return useMutation({
		mutationFn: ({
			phoneNumbers,
			message,
		}: {
			phoneNumbers: string[];
			message: string;
		}) =>
			api.post('api/whatsapp/message/bulk', {
				phoneNumbers,
				message,
			}),
		onSuccess: () => {
			toast.success('Messages Sent successfully');
		},
		onError: () => {
			toast.error(
				'Failed To send message.. please check whatsapp web connection or register whatsapp web again',
			);
		},
	});
};

export const useWhatsAppLogout = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => api.post('/api/whatsapp/logout'),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] });
		},
	});
};
