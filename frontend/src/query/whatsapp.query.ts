import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/service/api';

interface WhatsAppStatus {
  connected: boolean;
  phoneNumber?: string;
  connectedAt?: string;
}

interface QREvent {
  qr?: string;
  timeout?: boolean;
  error?: string;
}

export const useWhatsAppStatus = () => {
  return useQuery<WhatsAppStatus>({
    queryKey: ['whatsapp', 'status'],
    queryFn: () => api.get('/api/whatsapp/status').then(res => res.data.data),
    refetchInterval: 30000,
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

export const useWhatsAppQR = () => {
  return useMutation<void, Error, (event: QREvent) => void>({
    mutationFn: async (onQR) => {
      const token = localStorage.getItem('JWT_TOKEN');
      return new Promise<void>((resolve, reject) => {
        const eventSource = new EventSource(`http://localhost:5000/api/whatsapp/qr?token=${token}`, {
          withCredentials: true,
        });

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as QREvent;
            onQR(data);
            if (data.qr || data.timeout || data.error) {
              eventSource.close();
              if (data.error) {
                reject(new Error(data.error));
              } else {
                resolve();
              }
            }
          } catch {
            // Ignore parse errors
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          reject(new Error('Connection lost'));
        };
      });
    },
  });
};
