import {
	createLeadCategory,
	deleteLeadCategory,
	getLeadCategory,
	updateLeadCategory,
} from '@/service/leadCategory.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';

const getErrorMessage = (err: unknown) => {
	if (isAxiosError<IApiResponse>(err)) {
		const responseData = err.response?.data;
		return responseData?.message || responseData?.error || err.message;
	}

	if (err instanceof Error) {
		return err.message;
	}

	return 'Something went wrong';
};

export const useGetLeadCategory = function () {
	return useQuery({
		queryKey: ['leadCategory'],
		queryFn: () => getLeadCategory(),
	});
};

export const useCreateLeadCategory = function () {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createLeadCategory,
		onSuccess: (data) => {
			toast.success('Lead category created successfully');
			queryClient.invalidateQueries({ queryKey: ['leadCategory'] });
			return data;
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useUpdateLeadCategory = function () {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateLeadCategory,
		onSuccess: () => {
			toast.success('Category updated successfully');
			queryClient.invalidateQueries({ queryKey: ['leadCategory'] });
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useDeleteLeadCategory = function () {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteLeadCategory,
		onSuccess: () => {
			toast.success('Category deleted successfully');
			queryClient.invalidateQueries({ queryKey: ['leadCategory'] });
			queryClient.invalidateQueries({ queryKey: ['leads'] });
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};
