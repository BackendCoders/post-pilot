import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import {
	scrapMapData,
	bulkCreateLeads,
	getLeads,
	deleteLeads,
	deleteBulkLeads,
} from '@/service/leads.service';

const getErrorMessage = (err: unknown) => {
	if (isAxiosError<IApiResponse>(err)) {
		const responseData = err.response?.data;
		return responseData?.message || responseData?.error || err.message;
	}
	if (err instanceof Error) return err.message;
	return 'Something went wrong';
};

export const useScrapMapData = function () {
	return useMutation({
		mutationFn: scrapMapData,
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useBulkCreateLeads = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: bulkCreateLeads,
		onSuccess: () => {
			toast.success('Leads saved successfully!');
			queryClient.invalidateQueries({ queryKey: ['leads'] });
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useLeads = function (leadCategory?: string) {
	return useQuery({
		queryKey: ['leads', leadCategory],
		queryFn: () => getLeads(leadCategory),
		retry: false,
	});
};

export const useDeleteLead = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteLeads,
		onSuccess: () => {
			toast.success('lead removed successfully');
			queryClient.invalidateQueries({ queryKey: ['leads'] });
		},
		onError: () => toast.error('failed to remove the lead'),
	});
};

export const useDeleteBulkLeads = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteBulkLeads,
		onSuccess: () => {
			toast.success('lead removed successfully');
			queryClient.invalidateQueries({ queryKey: ['leads'] });
		},
		onError: () => toast.error('failed to remove the lead'),
	});
};
