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
