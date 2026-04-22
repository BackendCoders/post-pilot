import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth.query';
import {
	createSocials,
	getSocialBasedOnUserId,
	updateSocial,
} from '@/service/social.service';
import { toast } from 'sonner';

export const useGetSocials = function () {
	const { data } = useAuth();
	const authUser = data!;

	return useQuery<ISocialTypes | undefined>({
		queryKey: ['social', authUser.id],
		queryFn: () =>
			getSocialBasedOnUserId(authUser.id).then((data) => {
				if (data) return getSocialBasedOnUserId(authUser.id);
				return createSocials({ user: authUser.id } as any);
			}),
	});
};

export const useUpdateSocial = function () {
	const queryClient = useQueryClient();
	const { data } = useAuth();
	const authUser = data!;

	return useMutation({
		mutationFn: updateSocial,
		onSuccess: () => {
			toast.success('Credentials Updated');
			queryClient.invalidateQueries({ queryKey: ['social', authUser.id] });
		},
	});
};
