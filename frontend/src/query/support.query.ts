import { useMutation, useQuery } from '@tanstack/react-query';
import { submitSupport, getMySupportSubmissions } from '../service/support.service';
import type { SupportSubmissionData } from '../service/support.service';
import { toast } from 'react-hot-toast';

export const useSubmitSupport = () => {
  return useMutation({
    mutationFn: (data: SupportSubmissionData) => submitSupport(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Submitted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Submission failed';
      toast.error(message);
    },
  });
};

export const useGetMySupport = () => {
  return useQuery({
    queryKey: ['support', 'my'],
    queryFn: getMySupportSubmissions,
  });
};
