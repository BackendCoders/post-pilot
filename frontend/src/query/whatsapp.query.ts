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
		refetchInterval: 3000,
	});
};

export const useWhatsAppStart = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => api.post('/api/whatsapp/start'),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] });
		},
	});
};

export const useWhatsappSendMessagebulk = () => {
	const queryClient = useQueryClient();
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
			queryClient.invalidateQueries({ queryKey: ['leads'] });
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

export const useWhatsAppSendDocument = () => {
	return useMutation({
		mutationFn: ({
			phoneNumber,
			message,
			documentBase64,
			fileName,
			mimeType,
		}: {
			phoneNumber: string;
			message?: string;
			documentBase64: string;
			fileName: string;
			mimeType?: string;
		}) =>
			api.post('/api/whatsapp/message/document', {
				phoneNumber,
				message,
				documentBase64,
				fileName,
				mimeType,
			}),
		onSuccess: () => {
			toast.success('Report sent successfully via WhatsApp!');
		},
		onError: (error: unknown) => {
			const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to send document';
			toast.error(errorMessage);
		},
	});
};
