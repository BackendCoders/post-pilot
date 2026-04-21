import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import {
	scrapMapData,
	bulkCreateLeads,
	bulkUpdateLeads,
	getLeads,
	getLeadById,
	deleteLeads,
	deleteBulkLeads,
	updateLeadNote,
	updateLead,
	createLead,
} from '@/service/leads.service';

export interface IScrapedLeadsState {
	business: string;
	location: string;
	page: number;
	avgLat: number | null;
	avgLng: number | null;
	leads: ILeadScrapResult[];
}

const SCRAPED_LEADS_STATE_KEY = ['scraped-leads-state'] as const;

const initialScrapedLeadsState: IScrapedLeadsState = {
	business: '',
	location: '',
	page: 1,
	avgLat: null,
	avgLng: null,
	leads: [],
};

const getErrorMessage = (err: unknown) => {
	if (isAxiosError<IApiResponse>(err)) {
		const responseData = err.response?.data;
		return responseData?.message || responseData?.error || err.message;
	}
	if (err instanceof Error) return err.message;
	return 'Something went wrong';
};

export const useScrapedLeadsState = function () {
	return useQuery({
		queryKey: SCRAPED_LEADS_STATE_KEY,
		queryFn: () => initialScrapedLeadsState,
		initialData: initialScrapedLeadsState,
		staleTime: Infinity,
		gcTime: 1000 * 60 * 60 * 24,
	});
};

export const useScrapedLeadsStateActions = function () {
	const queryClient = useQueryClient();

	const setState = (
		updater:
			| IScrapedLeadsState
			| ((prev: IScrapedLeadsState) => IScrapedLeadsState),
	) => {
		queryClient.setQueryData<IScrapedLeadsState>(
			SCRAPED_LEADS_STATE_KEY,
			(prev = initialScrapedLeadsState) =>
				typeof updater === 'function'
					? (updater as (prev: IScrapedLeadsState) => IScrapedLeadsState)(prev)
					: updater,
		);
	};

	const resetState = () => {
		queryClient.setQueryData(SCRAPED_LEADS_STATE_KEY, initialScrapedLeadsState);
	};

	return { setState, resetState };
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
			toast.success('Leads saved to CRM', {
				description: 'Your selected leads are now available in Saved Leads.',
			});
			queryClient.invalidateQueries({ queryKey: ['leads'] });
		},
		onError: (err) => {
			toast.error('Could not save leads', {
				description: getErrorMessage(err),
			});
		},
	});
};

export const useBulkUpdateLeads = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: bulkUpdateLeads,
		onSuccess: () => {
			toast.success('Lead status updated', {
				description: 'Selected leads were updated successfully.',
			});
			queryClient.invalidateQueries({ queryKey: ['leads'] });
		},
		onError: (err) => {
			toast.error('Could not update leads', {
				description: getErrorMessage(err),
			});
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

export const useLead = function (leadId?: string) {
	return useQuery({
		queryKey: ['lead', leadId],
		queryFn: () => getLeadById(leadId as string),
		enabled: Boolean(leadId),
		retry: false,
	});
};

export const useDeleteLead = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteLeads,
		onSuccess: () => {
			toast.success('Lead deleted', {
				description: 'The lead has been removed successfully.',
			});
			queryClient.invalidateQueries({ queryKey: ['leads'] });
		},
		onError: (err) =>
			toast.error('Delete failed', {
				description: getErrorMessage(err),
			}),
	});
};

export const useDeleteBulkLeads = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteBulkLeads,
		onSuccess: () => {
			toast.success('Selected leads deleted', {
				description: 'Bulk delete completed successfully.',
			});
			queryClient.invalidateQueries({ queryKey: ['leads'] });
		},
		onError: (err) =>
			toast.error('Bulk delete failed', {
				description: getErrorMessage(err),
			}),
	});
};

export const useUpdateLeadNote = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ leadId, note }: { leadId: string; note: string }) =>
			updateLeadNote(leadId, note),
		onSuccess: () => {
			toast.success('Note saved', {
				description: 'Lead note has been updated.',
			});
			queryClient.invalidateQueries({ queryKey: ['leads'] });
		},
		onError: (err) =>
			toast.error('Failed to save note', {
				description: getErrorMessage(err),
			}),
	});
};

export const useUpdateLead = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ leadId, data }: { leadId: string; data: Partial<ILead> }) =>
			updateLead(leadId, data),
		onSuccess: () => {
			toast.success('Lead updated', {
				description: 'Lead has been updated successfully.',
			});
			queryClient.invalidateQueries({ queryKey: ['leads'] });
		},
		onError: (err) =>
			toast.error('Failed to update lead', {
				description: getErrorMessage(err),
			}),
	});
};

export const useCreateLead = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: Omit<ILead, '_id'>) => createLead(data),
		onSuccess: () => {
			toast.success('Lead created', {
				description: 'New lead has been created successfully.',
			});
			queryClient.invalidateQueries({ queryKey: ['leads'] });
		},
		onError: (err) =>
			toast.error('Failed to create lead', {
				description: getErrorMessage(err),
			}),
	});
};
