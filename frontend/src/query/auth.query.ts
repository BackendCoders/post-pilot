import {
	login,
	me,
	refresh,
	register,
	updateProfile,
	changePassword,
	googleAuth,
	completeWalkthrough,
	getUsage,
	getAvailablePlans,
	subscribeToPlan,
	verifyOtp,
	resendOtp,
	forgotPassword,
	resetPasswordWithOtp,
} from '@/service/auth.service';
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

export const useGoogleSignIn = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: googleAuth,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['auth'] });
			toast.success('Google authentication successful');
			persistAuthTokens(data);
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useSignUp = function () {
	return useMutation({
		mutationFn: register,
		onSuccess: () => {
			toast.success('Account created. Verify OTP sent to your email.');
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useVerifyOtp = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: verifyOtp,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['auth'] });
			toast.success('Email verified successfully');
			persistAuthTokens(data);
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};

export const useResendOtp = function () {
	return useMutation({
		mutationFn: resendOtp,
		onSuccess: () => toast.success('OTP resent successfully'),
		onError: (err) => toast.error(getErrorMessage(err)),
	});
};

export const useForgotPassword = function () {
	return useMutation({
		mutationFn: forgotPassword,
		onSuccess: () => toast.success('Reset OTP sent to your email'),
		onError: (err) => toast.error(getErrorMessage(err)),
	});
};

export const useResetPasswordWithOtp = function () {
	return useMutation({
		mutationFn: resetPasswordWithOtp,
		onSuccess: () => toast.success('Password reset successful. Please login.'),
		onError: (err) => toast.error(getErrorMessage(err)),
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

export const useCompleteWalkthrough = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: completeWalkthrough,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['auth'] });
		},
	});
};

export const useUsage = function () {
	return useQuery({
		queryKey: ['usage'],
		queryFn: getUsage,
		staleTime: 60 * 1000, // 1 minute stale time is very safe and prevents overfetching
	});
};

export const useAvailablePlans = function () {
	return useQuery({
		queryKey: ['available-plans'],
		queryFn: getAvailablePlans,
		staleTime: 60 * 1000,
	});
};

export const useSubscribeToPlan = function () {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: subscribeToPlan,
		onSuccess: (data) => {
			toast.success(data?.message || 'Plan updated');
			queryClient.invalidateQueries({ queryKey: ['usage'] });
			queryClient.invalidateQueries({ queryKey: ['available-plans'] });
		},
		onError: (err) => {
			toast.error(getErrorMessage(err));
		},
	});
};
