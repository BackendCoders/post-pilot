import { api } from './api';

export const getMessageTemplate = async function () {
	const url = `/api/leads/template/`;
	const response = await api.get<IApiResponse<IMessageTemplate[]>>(url);
	return response.data;
};

export const createMessageTemplate = async function (data: IMessageTemplate) {
	const url = `/api/leads/template/`;
	const response = await api.post(url, data);
	return response.data;
};

export const getMessageById = async function (id: string) {
	const url = `/api/leads/template/${id}`;
	const response = await api.get(url);
	return response.data;
};

export const updateMessageById = async function (
	id: string,
	data: Partial<IMessageTemplate>,
) {
	const url = `/api/leads/template/${id}`;
	const response = await api.patch(url, data);
	return response.data;
};

export const deteteMessageById = async function (id: string) {
	const url = `/api/leads/template/${id}`;
	const response = await api.delete(url);
	return response.data;
};
