'use client';

import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
	ChevronRight,
	ChevronsUpDown,
	PanelLeftClose,
	PanelLeftOpen,
	Send,
	Rocket,
	Home,
	Search,
	GalleryVerticalEnd,
	Bell,
	Command,
	Sun,
	Moon,
	HelpCircle,
	PersonStanding,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * M3 DESIGN SYSTEM COMPONENTS
 */
const Button = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & {
		variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
		size?: 'default' | 'sm' | 'icon';
	}
>(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
	const variants = {
		primary:
			'bg-primary text-primary-foreground shadow-md hover:brightness-110 active:scale-95',
		secondary: 'bg-muted text-foreground hover:bg-muted/80 active:scale-95',
		outline:
			'border border-border bg-transparent hover:bg-muted/50 text-foreground active:scale-95',
		ghost:
			'hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95',
	};
	const sizes = {
		default: 'h-10 px-4 py-2 text-sm',
		sm: 'h-8 px-3 text-xs',
		icon: 'h-9 w-9 p-2',
	};
	return (
		<button
			ref={ref}
			className={cn(
				'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:opacity-50',
				variants[variant],
				sizes[size],
				className,
			)}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

/**
 * NAVIGATION DATA
 */
const NAV_ITEMS = [
	{
		id: 'home',
		label: 'Home',
		icon: <Home size={18} />,
		path: '/dashboard/home',
	},
	{
		id: 'post-pilot',
		label: 'Post Pilot',
		icon: <Send size={18} />,
		subItems: [
			{ label: 'Overview', path: '/dashboard/post-pilot/overview' },
			{ label: 'Create Post', path: '/dashboard/post-pilot/create' },
			{ label: 'Manage Socials', path: '/dashboard/post-pilot/manage' },
		],
	},
	{
		id: 'seo-rocket',
		label: 'SEO Rocket',
		icon: <Rocket size={18} />,
		subItems: [
			{ label: 'Overview', path: '/dashboard/seo-rocket/overview' },
			{ label: 'Audit', path: '/dashboard/seo-rocket/audit' },
			{ label: 'Rankings', path: '/dashboard/seo-rocket/rankings' },
		],
	},
	{
		id: 'lead-generation',
		label: 'Lead Generation',
		icon: <PersonStanding size={18} />,
		subItems: [
			{ label: 'Overview', path: '/dashboard/lead-generation/overview' },
			{ label: 'Scrape Leads', path: '/dashboard/lead-generation/scrape' },
			{
				label: 'Saved Leads',
				path: '/dashboard/lead-generation/manage-saved-leads',
			},
			// {
			// 	label: 'Processed Leads',
			// 	path: '/dashboard/lead-generation/manage-processed-leads',
			// },
			// {
			// 	label: 'Complete Leads',
			// 	path: '/dashboard/lead-generation/manage-complete-leads',
			// },
			// {
			// 	label: 'Rejected Leads',
			// 	path: '/dashboard/lead-generation/manage-rejected-leads',
			// },
			{
				label: 'Message Template',
				path: '/dashboard/lead-generation/template',
			},
		],
	},
];

export default function GoogleModernLayout() {
	const location = useLocation();
	const [isDark, setIsDark] = useState(false);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [openMenus, setOpenMenus] = useState<string[]>(['post-pilot']);
	const navigate = useNavigate();

	// Dynamic Breadcrumb Logic
	const pathSegments = location.pathname.split('/').filter(Boolean);
	const breadcrumbs = pathSegments.map((segment, idx) => ({
		label: segment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
		path: '/' + pathSegments.slice(0, idx + 1).join('/'),
		isLast: idx === pathSegments.length - 1,
	}));

	return (
		<div
			className={cn(
				'flex h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20',
				isDark && 'dark',
			)}
		>
			{/* SIDEBAR: Google Workspace Style */}
			<aside
				className={cn(
					'border-r border-border bg-card/30 backdrop-blur-md flex flex-col z-50 transition-all duration-300',
					isSidebarCollapsed ? 'w-[84px]' : 'w-[280px]',
				)}
			>
				<div className='p-4'>
					<div
						className={cn(
							'flex items-center p-2 rounded-2xl hover:bg-muted/50 transition-all cursor-pointer group border border-transparent hover:border-border/50',
							isSidebarCollapsed ? 'justify-center' : 'gap-3',
						)}
					>
						<div className='w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/10'>
							<GalleryVerticalEnd size={20} />
						</div>
						{!isSidebarCollapsed && (
							<>
								<div className='flex flex-col flex-1 overflow-hidden'>
									<span className='text-sm font-bold tracking-tight truncate'>
										Google Cloud
									</span>
									<span className='text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider'>
										Production
									</span>
								</div>
								<ChevronsUpDown
									size={16}
									className='text-muted-foreground/50'
								/>
							</>
						)}
					</div>
					<div
						className={cn(
							'mt-3 flex',
							isSidebarCollapsed ? 'justify-center' : 'justify-end',
						)}
					>
						<Button
							variant='ghost'
							size='icon'
							className='rounded-full'
							onClick={() => setIsSidebarCollapsed((prev) => !prev)}
							title={
								isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
							}
						>
							{isSidebarCollapsed ? (
								<PanelLeftOpen size={18} />
							) : (
								<PanelLeftClose size={18} />
							)}
						</Button>
					</div>
				</div>

				<nav
					className={cn(
						'flex-1 overflow-y-auto pb-4 space-y-1',
						isSidebarCollapsed ? 'px-2' : 'px-4',
					)}
				>
					{NAV_ITEMS.map((item) => {
						const hasSub = !!item.subItems;
						const isOpen = openMenus.includes(item.id);
						const isActive = location.pathname.includes(item.id);

						return (
							<div
								key={item.id}
								className='mb-1'
							>
								<button
									onClick={() =>
										hasSub && !isSidebarCollapsed
											? setOpenMenus((prev) =>
													prev.includes(item.id)
														? prev.filter((i) => i !== item.id)
														: [...prev, item.id],
												)
											: navigate(
													item.path || item.subItems?.[0]?.path || '/dashboard/home',
												)
									}
									className={cn(
										'w-full flex items-center rounded-xl transition-all text-sm font-medium group',
										isSidebarCollapsed
											? 'justify-center px-2 py-2.5'
											: 'gap-3 px-3 py-2.5',
										isActive && !hasSub
											? 'bg-primary/10 text-primary'
											: 'text-muted-foreground hover:bg-muted hover:text-foreground',
									)}
									title={item.label}
								>
									<span
										className={cn(
											'transition-colors',
											isActive ? 'text-primary' : 'group-hover:text-foreground',
										)}
									>
										{item.icon}
									</span>
									{!isSidebarCollapsed && (
										<span className='flex-1 text-left'>{item.label}</span>
									)}
									{hasSub && !isSidebarCollapsed && (
										<ChevronRight
											size={14}
											className={cn(
												'transition-transform duration-200',
												isOpen && 'rotate-90',
											)}
										/>
									)}
								</button>

								{hasSub && isOpen && !isSidebarCollapsed && (
									<div className='mt-1 ml-4 border-l border-border/60 pl-4 space-y-1'>
										{item.subItems.map((sub) => (
											<Link
												key={sub.path}
												to={sub.path}
												className={cn(
													'block py-2 px-3 text-sm rounded-lg transition-all',
													location.pathname === sub.path
														? 'text-primary font-semibold bg-primary/5'
														: 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
												)}
											>
												{sub.label}
											</Link>
										))}
									</div>
								)}
							</div>
						);
					})}
				</nav>

				{/* BOTTOM UTILS */}
				<div
					className={cn(
						'p-4 border-t border-border/50 space-y-2',
						isSidebarCollapsed && 'px-2',
					)}
				>
					<div
						className={cn(
							'flex items-center p-2 rounded-2xl hover:bg-muted transition-all cursor-pointer',
							isSidebarCollapsed ? 'justify-center' : 'gap-3',
						)}
					>
						<div className='w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-xs font-bold shadow-inner'>
							AD
						</div>
						{!isSidebarCollapsed && (
							<div className='flex flex-col flex-1 overflow-hidden'>
								<span className='text-sm font-bold truncate'>Admin User</span>
								<span className='text-xs text-muted-foreground truncate'>
									admin@google.com
								</span>
							</div>
						)}
					</div>
				</div>
			</aside>

			{/* MAIN CONTENT AREA */}
			<div className='flex-1 flex flex-col min-w-0'>
				{/* HEADER: Dynamic Breadcrumbs + Themed Search */}
				<header className='h-16 border-b border-border bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40'>
					<div className='flex items-center gap-2 overflow-hidden mr-4'>
						<Link
							to='/dashboard/home'
							className='text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-md'
						>
							<Home size={18} />
						</Link>
						{breadcrumbs.map((crumb) => (
							<React.Fragment key={crumb.path}>
								<ChevronRight
									size={14}
									className='text-muted-foreground/30 shrink-0'
								/>
								<Link
									to={crumb.path}
									className={cn(
										'text-sm font-medium truncate transition-colors px-2 py-1 rounded-md hover:bg-muted',
										crumb.isLast
											? 'text-foreground font-bold'
											: 'text-muted-foreground',
									)}
								>
									{crumb.label}
								</Link>
							</React.Fragment>
						))}
					</div>

					<div className='flex items-center gap-3'>
						{/* GOOGLE MODERN SEARCH */}
						<div className='relative group hidden lg:block'>
							<Search
								className='absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors'
								size={16}
							/>
							<input
								type='text'
								placeholder='Search resources, apps, and docs'
								className='w-[320px] bg-muted/40 border border-transparent rounded-full py-2.5 pl-11 pr-14 text-sm transition-all focus:w-[480px] focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none shadow-sm'
							/>
							<div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1'>
								<kbd className='h-5 px-1.5 bg-background border border-border rounded-md text-[10px] flex items-center text-muted-foreground font-sans font-bold shadow-sm'>
									<Command
										size={10}
										className='mr-1'
									/>{' '}
									K
								</kbd>
							</div>
						</div>

						<div className='flex items-center gap-1 pl-2 border-l border-border/60'>
							<Button
								variant='ghost'
								size='icon'
								onClick={() => setIsDark(!isDark)}
								className='rounded-full'
							>
								{isDark ? <Sun size={20} /> : <Moon size={20} />}
							</Button>
							<Button
								variant='ghost'
								size='icon'
								className='rounded-full text-muted-foreground'
							>
								<HelpCircle size={20} />
							</Button>
							<Button
								variant='ghost'
								size='icon'
								className='rounded-full text-muted-foreground relative'
							>
								<Bell size={20} />
								<span className='absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background' />
							</Button>
						</div>
					</div>
				</header>

				{/* UNRESTRICTED VIEWPORT */}
				<main className='flex-1 overflow-y-auto'>
					{/* Content flows freely here */}
					<div className='p-8 md:p-10 lg:p-12 animate-in fade-in slide-in-from-bottom-2 duration-500'>
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}
