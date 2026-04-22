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
import SEORocketPage from './pages/dashboard/seo-rocket';
import LeadGeneratorPage from './pages/lead-generator';
import { Toaster } from '@/components/ui/sonner';
import LoginScreen from './pages/auth';
import SignUpScreen from './pages/signup';
import Protected from './components/Protected';
import DashboardLayout from './components/dashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import RouteErrorPage from './pages/ErrorPage';

import DashboardHome from './pages/dashboard';
import SavedLead from './pages/dashboard/lead-generation/savedLeads';
import ProcessedLeads from './pages/dashboard/lead-generation/processedLeads';
import ConvertedLeads from './pages/dashboard/lead-generation/convertedLeads';
import RejectedLeads from './pages/dashboard/lead-generation/RejectedLeads';
import MessageTemplate from '@/pages/dashboard/lead-generation/MessageTemplate';
import LeadBriefAnalysisPage from '@/pages/dashboard/lead-generation/briefAnalysis';
import LeadOverview from './pages/dashboard/lead-generation/overview';
import ProfilePage from '@/pages/dashboard/profile';
import SEORocketHistory from './pages/dashboard/seo-rocket/history';
import SeoOverview from './pages/dashboard/seo-rocket/overview';

const router = createBrowserRouter([
	{
		path: '/',
		errorElement: <RouteErrorPage />,
		element: (
			<Protected>
				<HomePage />
			</Protected>
		),
	},

	{
		errorElement: <RouteErrorPage />,
		element: (
			<Protected>
				<Outlet />
			</Protected>
		),
		children: [
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
						path: 'seo-rocket',
						children: [
							{ path: '', element: <SEORocketPage /> },
							{ path: 'overview', element: <SeoOverview /> },
							{ path: 'history', element: <SEORocketHistory /> },
							{ path: 'sitemap', element: <SEORocketPage /> },
							{ path: 'results', element: <SEORocketPage /> },
							{ path: 'single', element: <SEORocketPage /> },
						],
					},
					{
						path: 'profile',
						element: (
							<Navigate
								to='personal'
								replace
							/>
						),
					},
					{ path: 'profile/:section', element: <ProfilePage /> },
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
						path: 'lead-generation',
						children: [
							{ path: 'overview', element: <LeadOverview />, index: true },
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
	{ path: '/login', errorElement: <RouteErrorPage />, element: <LoginScreen /> },
	{ path: '/signup', errorElement: <RouteErrorPage />, element: <SignUpScreen /> },
]);

const queryClient = new QueryClient();

function App() {
	return (
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<DarkModeProvider>
					<Toaster />
					<RouterProvider router={router} />
				</DarkModeProvider>
			</QueryClientProvider>
		</ErrorBoundary>
	);
}

export default App;
