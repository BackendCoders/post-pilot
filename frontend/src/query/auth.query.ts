import { login, me, refresh, register, updateProfile, changePassword } from '@/service/auth.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const persistAuthTokens = (data?: Pick<ILoginResponse, 'token' | 'refreshToken'>) => {
	if (data?.refreshToken && data.token) {
		localStorage.setItem('JWT_TOKEN', data.token);
		localStorage.setItem('REFRESH_TOKEN', data.refreshToken);
	}
};

const getErrorMessage = (err: unknown) => {
	if (isAxiosError<IApiResponse>(err)) {
		const responseData = err.response?.data;
		return responseData?.message || responseData?.error || err.message;
	}

	if (err instanceof Error) return err.message;

	return 'Something went wrong';
};

export const useAuth = function () {
	return useQuery({ queryKey: ['auth'], queryFn: me, retry: false });
};

export const useSignIn = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: login,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['auth'] });
			toast.success('User Successfully Authenticated');
			persistAuthTokens(data);
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useSignUp = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: register,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['auth'] });
			toast.success('Account created successfully');
			persistAuthTokens(data);
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useRefreshToken = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: refresh,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['auth'] });
			persistAuthTokens(data);
		},
		onError: () => {
			localStorage.removeItem('JWT_TOKEN');
			localStorage.removeItem('REFRESH_TOKEN');
		},
	});
};

export const useLogout = function () {
	const queryClient = useQueryClient();
	const navigation = useNavigate();

	const handleLogout = () => {
		localStorage.removeItem('JWT_TOKEN');
		localStorage.removeItem('REFRESH_TOKEN');
		queryClient.removeQueries({ queryKey: ['auth'] });
		navigation('/login');
	};

	return { handleLogout };
};

export const useUpdateProfile = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: updateProfile,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['auth'] });
			toast.success('Profile updated successfully');
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useChangePassword = function () {
	return useMutation({
		mutationFn: changePassword,
		onSuccess: () => {
			toast.success('Password changed successfully');
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};
