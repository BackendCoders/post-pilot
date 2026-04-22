import { api as API } from './api';

export interface SupportSubmissionData {
  type: 'feedback' | 'error';
  subject: string;
  message: string;
  rating?: number;
  metadata?: any;
}

export const submitSupport = async (data: SupportSubmissionData): Promise<IApiResponse> => {
  const response = await API.post('/api/support', data);
  return response.data;
};

export const getMySupportSubmissions = async (): Promise<IApiResponse> => {
  const response = await API.get('/api/support/my');
  return response.data;
};
