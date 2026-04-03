import {
	createBrowserRouter,
	RouterProvider,
	Navigate,
	Outlet,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkModeProvider } from './context/DarkModeContext';

import HomePage from './pages/home/page';
import ProfilePage from './pages/profile';
import ConsolePage from './pages/console';
import SEORocketPage from './pages/seo-rocket';
import LeadGeneratorPage from './pages/lead-generator';
import { Toaster } from 'sonner';
import LoginScreen from './pages/auth';
import SignUpScreen from './pages/signup';
import Protected from './components/Protected';
import DashboardLayout from './components/dashboardLayout';

import DashboardHome from './pages/dashboard';
import SavedLead from './pages/dashboard/lead-generation/savedLeads';
import MessageTemplate from '@/pages/dashboard/lead-generation/MessageTemplate';

const router = createBrowserRouter([
	{
		path: '/',
		element: (
			<Protected>
				<HomePage />
			</Protected>
		),
	},

	{
		element: (
			<Protected>
				<Outlet />
			</Protected>
		),
		children: [
			{ path: 'seo-rocket', element: <SEORocketPage /> },
			{ path: 'lead-generator', element: <LeadGeneratorPage /> },
			{
				path: 'console',
				element: (
					<Navigate
						to='/post-pilot'
						replace
					/>
				),
			},
			{
				path: 'dashboard',
				element: (
					<Protected>
						<DashboardLayout />
					</Protected>
				),
				children: [
					{
						index: true,
						element: (
							<Navigate
								to='home'
								replace
							/>
						),
					},
					{ path: 'home', element: <DashboardHome /> },
					{
						path: 'post-pilot',
						children: [
							{ path: 'overview', element: <ProfilePage />, index: true },
							{ path: 'create', element: <ConsolePage /> },
							{ path: 'manage', element: <ProfilePage /> },
						],
					},
					{
						path: 'seo-rocket',
						children: [
							{ path: 'overview', element: <SEORocketPage />, index: true },
							{ path: 'audit', element: <SEORocketPage /> },
							{ path: 'rankings', element: <SEORocketPage /> },
						],
					},
					{
						path: 'lead-generation',
						children: [
							{ path: 'overview', element: <LeadGeneratorPage />, index: true },
							{ path: 'scrape', element: <LeadGeneratorPage /> },
							{ path: 'manage-saved-leads', element: <SavedLead /> },
							{ path: 'template', element: <MessageTemplate /> },
						],
					},
				],
			},
		],
	},
	{ path: '/login', element: <LoginScreen /> },
	{ path: '/signup', element: <SignUpScreen /> },
]);

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<DarkModeProvider>
				<Toaster />
				<RouterProvider router={router} />
			</DarkModeProvider>
		</QueryClientProvider>
	);
}

export default App;
