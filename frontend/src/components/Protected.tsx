import { useAuth, useRefreshToken } from '@/query/auth.query';
import { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Loading from './Loading';

function Protected({ children }: { children: ReactNode }) {
	const { data, error, isLoading } = useAuth();
	const { mutate: refreshToken, isPending } = useRefreshToken();

	useEffect(() => {
		if (error) {
			const token = localStorage.getItem('REFRESH_TOKEN');
			if (token) refreshToken(token);
		}
	}, [error, refreshToken]);

	if (isLoading || isPending) return <Loading />;

	if (!data || error) return <Navigate to='/login' replace />;

	return <>{children}</>;
}

export default Protected;
