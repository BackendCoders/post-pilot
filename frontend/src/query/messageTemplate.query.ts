import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import {
	getMessageTemplate,
	createMessageTemplate,
	getMessageById,
	updateMessageById,
	deteteMessageById,
} from '@/service/messageTemplate';

const getErrorMessage = (err: unknown) => {
	if (isAxiosError<IApiResponse>(err)) {
		const responseData = err.response?.data;
		return responseData?.message || responseData?.error || err.message;
	}
	if (err instanceof Error) return err.message;
	return 'Something went wrong';
};

export const useMessageTemplates = function () {
	return useQuery({
		queryKey: ['messageTemplates'],
		queryFn: getMessageTemplate,
		retry: false,
	});
};

export const useMessageTemplateById = function (id: string) {
	return useQuery({
		queryKey: ['messageTemplate', id],
		queryFn: () => getMessageById(id),
		retry: false,
	});
};

export const useCreateMessageTemplate = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createMessageTemplate,
		onSuccess: () => {
			toast.success('Message template created successfully!');
			queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useUpdateMessageTemplate = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: Partial<IMessageTemplate>;
		}) => updateMessageById(id, data),
		onSuccess: () => {
			toast.success('Message template updated successfully!');
			queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useDeleteMessageTemplate = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deteteMessageById(id),
		onSuccess: () => {
			toast.success('Message template deleted successfully!');
			queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};
