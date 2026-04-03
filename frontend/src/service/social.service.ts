import { api } from './api';

const BASE_API = '/api/socials';

export const createSocials = async function (body: ISocialTypes) {
	const res = await api.post<IApiResponse<ISocialTypes>>(BASE_API, body);
	return res.data.data;
};

export const getSocialBasedOnUserId = async function (userId: string) {
	const res = await api.get<IApiResponse<ISocialTypes[]>>(
		`${BASE_API}/?user=${userId}`,
	);
	const data = res.data.data;
	if (data && data?.length > 0) return data[0];
	else return undefined;
};

export const getSocial = async function (id: string) {
	const res = await api.get<IApiResponse<ISocialTypes>>(`${BASE_API}/${id}`);
	return res.data.data;
};

export const updateSocial = async function ({
	id,
	body,
}: {
	id: string;
	body: Record<string, string>;
}) {
	const res = await api.patch<IApiResponse<ISocialTypes>>(
		`${BASE_API}/${id}`,
		body,
	);
	return res.data.data;
};
