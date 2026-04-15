import {
	createBrowserRouter,
	RouterProvider,
	Navigate,
	Outlet,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkModeProvider } from './context/DarkModeContext';

import HomePage from './pages/home/page';
// import ProfilePage from './pages/profile';
import ConsolePage from './pages/console';
import SEORocketPage from './pages/seo-rocket';
import LeadGeneratorPage from './pages/lead-generator';
import { Toaster } from '@/components/ui/sonner';
import LoginScreen from './pages/auth';
import SignUpScreen from './pages/signup';
import Protected from './components/Protected';
import DashboardLayout from './components/dashboardLayout';

import DashboardHome from './pages/dashboard';
import SavedLead from './pages/dashboard/lead-generation/savedLeads';
import ProcessedLeads from './pages/dashboard/lead-generation/processedLeads';
import ConvertedLeads from './pages/dashboard/lead-generation/convertedLeads';
import RejectedLeads from './pages/dashboard/lead-generation/RejectedLeads';
import MessageTemplate from '@/pages/dashboard/lead-generation/MessageTemplate';
import LeadBriefAnalysisPage from '@/pages/dashboard/lead-generation/briefAnalysis';
import ProfilePage from '@/pages/dashboard/profile';

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
					{ path: 'profile', element: <ProfilePage /> },
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
							{ path: 'manage-processed-leads', element: <ProcessedLeads /> },
							{ path: 'manage-complete-leads', element: <ConvertedLeads /> },
							{ path: 'manage-rejected-leads', element: <RejectedLeads /> },
							{ path: 'template', element: <MessageTemplate /> },
							{
								path: 'brief-analysis/:leadId',
								element: <LeadBriefAnalysisPage />,
							},
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
