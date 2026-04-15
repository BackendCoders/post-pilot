import { api } from './api';

export const me = async function () {
	const res = await api.get<IApiResponse<UserType>>('/api/auth/me');
	return res.data.data;
};

export const login = async function ({
	email,
	password,
}: {
	email: string;
	password: string;
}) {
	const res = await api.post<IApiResponse<ILoginResponse>>('/api/auth/login', {
		email,
		password,
	});
	return res.data.data;
};

export const register = async function ({
	email,
	password,
	userName,
}: {
	email: string;
	password: string;
	userName: string;
}) {
	const res = await api.post<IApiResponse<ILoginResponse>>(
		'/api/auth/register',
		{
			email,
			password,
			userName,
		},
	);
	return res.data.data;
};

export const refresh = async function (refreshToken: string | null = null) {
	const token = refreshToken || localStorage.getItem('REFRESH_TOKEN');
	const res = await api.post<
		IApiResponse<{ token: string; refreshToken: string }>
	>('/api/auth/refresh', {
		refreshToken: token,
	});

	return res.data.data;
};

export const updateProfile = async function ({
	userName,
	email,
	avatar,
	phoneNumber,
	companyName,
	companySize,
	jobTitle,
	website,
	linkedinUrl,
	timezone,
	language,
	emailNotifications,
}: {
	userName?: string;
	email?: string;
	avatar?: string;
	phoneNumber?: string;
	companyName?: string;
	companySize?: string;
	jobTitle?: string;
	website?: string;
	linkedinUrl?: string;
	timezone?: string;
	language?: string;
	emailNotifications?: boolean;
}) {
	const res = await api.put<IApiResponse>('/api/users/profile', {
		userName,
		email,
		avatar,
		phoneNumber,
		companyName,
		companySize,
		jobTitle,
		website,
		linkedinUrl,
		timezone,
		language,
		emailNotifications,
	});
	return res.data;
};

export const changePassword = async function ({
	currentPassword,
	newPassword,
}: {
	currentPassword: string;
	newPassword: string;
}) {
	const res = await api.put<IApiResponse>('/api/users/change-password', {
		currentPassword,
		newPassword,
	});
	return res.data;
};
