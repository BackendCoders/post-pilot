import { api } from './api';

export const getLeadCategory = async (
	query?: Record<string, string | number | undefined>,
) => {
	const searchParams = new URLSearchParams();

	Object.entries(query ?? {}).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			searchParams.set(key, String(value));
		}
	});

	const queryString = searchParams.toString();
	const response = await api.get<IApiResponse<ILeadCategory[]>>(
		`/api/leads/category${queryString ? `?${queryString}` : ''}`,
	);
	return response.data;
};

export const createLeadCategory = async (data: {
	user?: string;
	title: string;
	description?: string;
}) => {
	const response = await api.post<IApiResponse<ILeadCategory>>(
		'/api/leads/category',
		data,
	);
	return response.data;
};
