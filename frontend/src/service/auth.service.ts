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

export const googleAuth = async function ({
	idToken,
	accessToken,
}: {
	idToken?: string;
	accessToken?: string;
}) {
	const res = await api.post<IApiResponse<ILoginResponse>>('/api/auth/google', {
		idToken,
		accessToken,
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
	const res = await api.post<IApiResponse>(
		'/api/auth/register',
		{
			email,
			password,
			userName,
		},
	);
	return res.data;
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

export const completeWalkthrough = async function (walkthroughKey: string) {
	const res = await api.patch<IApiResponse>('/api/users/walkthrough', {
		walkthroughKey,
	});
	return res.data;
};

export const getUsage = async function () {
	const res = await api.get<{
		success: boolean;
		data: {
			plan: {
				id: string;
				name: string;
				price: number;
				interval: string;
				isDefault: boolean;
				isLease: boolean;
				metrics: any;
			} | null;
			usage: {
				billingPeriodStart: string;
				billingPeriodEnd: string;
				seoWebpageAnalysisCount: number;
				seoPageSpeedCount: number;
				leadGenTemplatesCreated: number;
				leadGenPagesScraped: number;
				leadGenLeadsScraped: number;
				leadGenSystemTemplatesUpdated: number;
			};
			limits: {
				seo: {
					webpageAnalysisLimit: number;
					webpageAnalysisUsed: number;
					webpageAnalysisRemaining: number;
					downloadReport: boolean;
					trackHistory: boolean;
					maxHistoryCount: number;
					pageSpeedAndLoadtime: boolean;
					aiFixSuggestion: boolean;
					whatsappIntegration: boolean;
				};
				leadGen: {
					pageScrapeLimit: number;
					pageScrapesUsed: number;
					pageScrapesRemaining: number;
					totalLeadInOneExecutionLimit: number;
					messageTemplateCreationLimit: number;
					systemMessageTemplateUpdateLimit: boolean;
					messageTemplateAccessLimit: boolean;
					messagePortalAccess: boolean;
					reportExportFeature: boolean;
				};
			} | null;
		};
	}>('/api/usage/me');
	return res.data.data;
};

export const getAvailablePlans = async function () {
	const res = await api.get<{
		success: boolean;
		data: Array<{
			id: string;
			name: string;
			price: number;
			interval: string;
			isDefault: boolean;
			isLease: boolean;
			metrics: any;
		}>;
	}>('/api/usage/plans');
	return res.data.data;
};

export const verifyOtp = async function ({ email, otp }: { email: string; otp: string }) {
	const res = await api.post<IApiResponse<ILoginResponse>>('/api/auth/verify-otp', { email, otp });
	return res.data.data;
};

export const resendOtp = async function (email: string) {
	const res = await api.post<IApiResponse>('/api/auth/resend-otp', { email });
	return res.data;
};

export const forgotPassword = async function (email: string) {
	const res = await api.post<IApiResponse>('/api/auth/forgot-password', { email });
	return res.data;
};

export const resetPasswordWithOtp = async function ({
	email,
	otp,
	newPassword,
}: {
	email: string;
	otp: string;
	newPassword: string;
}) {
	const res = await api.post<IApiResponse>('/api/auth/reset-password-otp', {
		email,
		otp,
		newPassword,
	});
	return res.data;
};

export const subscribeToPlan = async function (planId: string) {
	const res = await api.post<{
		success: boolean;
		message: string;
	}>('/api/usage/subscribe/' + planId);
	return res.data;
};
