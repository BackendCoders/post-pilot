import {
	createLeadCategory,
	getLeadCategory,
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
