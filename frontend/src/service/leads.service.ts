import { api } from './api';

export const scrapMapData = async (data: {
	business: string;
	location: string;
	page?: number;
	latitude?: number;
	longitude?: number;
}) => {
	const response = await api.post<ILeadScrapResult[]>(
		'/api/leads/scrap-map-data',
		data,
	);
	return response.data;
};

export const bulkCreateLeads = async (data: IBulkCreateLeadsBody) => {
	const response = await api.post<IApiResponse>('/api/leads/bulk', data);
	return response.data;
};

export const bulkUpdateLeads = async (data: IBulkUpdateBody) => {
	const response = await api.patch<IApiResponse>('/api/leads/bulk/status', data);
	return response.data;
};

export const getLeads = async (leadCategory?: string) => {
	const url = leadCategory
		? `/api/leads?limit=1000&leadCategory=${leadCategory}`
		: '/api/leads?limit=1000';
	const response = await api.get<IApiResponse<ILead[]>>(url);
	return response.data;
};

export const getLeadById = async (leadId: string) => {
	const response = await api.get<IApiResponse<ILead>>(`/api/leads/${leadId}`);
	return response.data;
};

export const deleteLeads = async (leadId: string) => {
	const url = `/api/leads/${leadId}`;
	const response = await api.delete<IApiResponse<null>>(url);
	return response.data;
};

export const deleteBulkLeads = async (leadIds: string[]) => {
	const url = `/api/leads/bulk/delete`;
	const response = await api.post<IApiResponse<null>>(url, { ids: leadIds });
	return response.data;
};

export const updateLeadNote = async (leadId: string, note: string) => {
	const response = await api.patch<IApiResponse<ILead>>(`/api/leads/${leadId}`, {
		note,
	});
	return response.data;
};

export const updateLead = async (leadId: string, data: Partial<ILead>) => {
	const response = await api.patch<IApiResponse<ILead>>(`/api/leads/${leadId}`, data);
	return response.data;
};

export const createLead = async (data: Omit<ILead, '_id'>) => {
	const response = await api.post<IApiResponse<ILead>>('/api/leads', data);
	return response.data;
};
