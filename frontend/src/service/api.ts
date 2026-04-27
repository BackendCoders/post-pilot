import axios from 'axios';

export const api = axios.create({
	baseURL: `${import.meta.env.VITE_BASE_URL || 'http://localhost:5000'}/api`,

	timeout: 100000,
	headers: {
		'Content-Type': 'application/json',
	},
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('JWT_TOKEN');

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			console.log('Unauthorized → redirect to login');
		}

		return Promise.reject(error);
	},
);
