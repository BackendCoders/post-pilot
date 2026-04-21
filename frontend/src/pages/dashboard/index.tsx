import React from 'react';
import { Link } from 'react-router-dom';
import {
	Activity,
	ArrowRight,
	CheckCircle2,
	Globe2,
	PieChart,
	PlugZap,
	Tags,
	TrendingDown,
	TrendingUp,
	Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/query/auth.query';
import { useLeads } from '@/query/leads.query';
import { useUserSeoStats } from '@/query/seo-analysis.query';
import { useGetSocials } from '@/query/socials.query';
import WhatsAppConnectionPanel from '@/components/whatsapp/WhatsAppConnectionPanel';
import DonutChart from '@/components/charts/DonutChart';
import Sparkline from '@/components/charts/Sparkline';

const Button = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & {
		variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
		size?: 'default' | 'sm' | 'icon';
	}
>(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
	const variants = {
		primary:
			'bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.98]',
		secondary: 'bg-muted text-foreground hover:bg-muted/80',
		outline:
			'border border-border bg-transparent hover:bg-muted/50 text-foreground',
		ghost: 'hover:bg-muted text-muted-foreground hover:text-foreground',
	};
	const sizes = {
		default: 'px-4 py-2 text-sm',
		sm: 'px-3 py-1.5 text-xs',
		icon: 'h-8 w-8 p-1.5',
	};
	return (
		<button
			ref={ref}
			className={cn(
				'inline-flex items-center justify-center rounded-lg font-medium transition-all disabled:opacity-50',
				variants[variant],
				sizes[size],
				className,
			)}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

function StatCard({
	title,
	value,
	desc,
}: {
	title: string;
	value: string;
	desc: string;
}) {
	return (
		<div className='p-5 rounded-xl border border-border bg-card shadow-sm'>
			<h3 className='text-sm font-medium text-muted-foreground'>{title}</h3>
			<div className='mt-2 flex items-baseline gap-2'>
				<span className='text-2xl font-semibold tracking-tight'>{value}</span>
			</div>
			<p className='text-xs text-muted-foreground mt-1'>{desc}</p>
		</div>
	);
}

function formatDayKey(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function startOfDay(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getLeadDate(lead: unknown): Date | null {
	if (!lead || typeof lead !== 'object') return null;
	const maybe = lead as { createdAt?: unknown; updatedAt?: unknown };
	const dtRaw = maybe.createdAt ?? maybe.updatedAt;
	if (!dtRaw) return null;
	const dt = dtRaw instanceof Date ? dtRaw : new Date(String(dtRaw));
	if (Number.isNaN(dt.getTime())) return null;
	return dt;
}

function ProgressBar({
	value,
	colorVar = '--chart-1',
	className,
}: {
	value: number;
	colorVar?: `--${string}`;
	className?: string;
}) {
	const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
	return (
		<div
			className={cn(
				'h-2 w-full rounded-full bg-muted/60 overflow-hidden',
				className,
			)}
		>
			<div
				className='h-full rounded-full'
				style={{ width: `${pct * 100}%`, background: `var(${colorVar})` }}
			/>
		</div>
	);
}

type LeadLike = {
	status?: unknown;
	rating?: unknown;
	category?: unknown;
	createdAt?: unknown;
	updatedAt?: unknown;
};

export default function DashboardHome() {
	const { data: authUser } = useAuth();
	const { data: leadsResponse } = useLeads();
	const { data: seoStats } = useUserSeoStats();
	const { data: socialData } = useGetSocials();

	const leads = (Array.isArray(leadsResponse?.data) ? leadsResponse.data : []) as LeadLike[];

	const leadCounts = leads.reduce(
		(
			acc: { saved: number; processed: number; converted: number; rejected: number },
			lead,
		) => {
			const status = String(lead?.status || '').toLowerCase();
			if (status === 'saved') acc.saved += 1;
			else if (status === 'processed') acc.processed += 1;
			else if (status === 'converted') acc.converted += 1;
			else if (status === 'rejected') acc.rejected += 1;
			return acc;
		},
		{ saved: 0, processed: 0, converted: 0, rejected: 0 },
	);

	const totalLeads = leads.length;
	const conversionRate =
		totalLeads > 0
			? ((leadCounts.converted / totalLeads) * 100).toFixed(1)
			: '0.0';

	const avgRating = (() => {
		const rated = leads
			.map((l) => (typeof l?.rating === 'number' ? (l.rating as number) : null))
			.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
		if (rated.length === 0) return null;
		const sum = rated.reduce((a, b) => a + b, 0);
		return sum / rated.length;
	})();

	const topCategories = (() => {
		const counts = new Map<string, number>();
		for (const lead of leads) {
			const raw = (lead?.category ?? '').toString().trim();
			if (!raw) continue;
			const key = raw.length > 22 ? `${raw.slice(0, 22)}…` : raw;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return [...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 4)
			.map(([name, count]) => ({ name, count }));
	})();

	const leadStatusSegments = [
		{ label: 'Saved', value: leadCounts.saved, colorVar: '--chart-1' as const },
		{
			label: 'Processed',
			value: leadCounts.processed,
			colorVar: '--chart-2' as const,
		},
		{
			label: 'Converted',
			value: leadCounts.converted,
			colorVar: '--chart-3' as const,
		},
		{
			label: 'Rejected',
			value: leadCounts.rejected,
			colorVar: '--chart-5' as const,
		},
	].filter((s) => s.value > 0);

	const leadActivitySeries = (() => {
		const now = new Date();
		const end = startOfDay(now);
		const start = new Date(end);
		start.setDate(start.getDate() - 13);

		const counts = new Map<string, number>();
		for (const lead of leads) {
			const dt = getLeadDate(lead);
			if (!dt) continue;
			const day = startOfDay(dt);
			if (day < start || day > end) continue;
			const key = formatDayKey(day);
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}

		const days: { key: string; count: number }[] = [];
		for (let i = 13; i >= 0; i -= 1) {
			const d = new Date(end);
			d.setDate(d.getDate() - i);
			const key = formatDayKey(d);
			days.push({ key, count: counts.get(key) ?? 0 });
		}
		return days;
	})();

	const leadsLast7Days = leadActivitySeries
		.slice(-7)
		.reduce((sum, d) => sum + d.count, 0);
	const leadsPrev7Days = leadActivitySeries
		.slice(0, 7)
		.reduce((sum, d) => sum + d.count, 0);
	const wowDelta = leadsPrev7Days > 0 ? (leadsLast7Days - leadsPrev7Days) / leadsPrev7Days : null;

	const connectedChannels = [
		socialData?.insta_auth_token,
		socialData?.meta_auth_token,
		socialData?.linkedin_auth_token,
		socialData?.tiktok_auth_token,
	].filter(Boolean).length;

	const seoTotalAnalyses = seoStats?.totalAnalyses ?? 0;
	const seoPagesAnalyzed = seoStats?.totalPagesAnalyzed ?? 0;
	const seoUniqueUrls = seoStats?.uniqueUrlsAnalyzed ?? 0;
	const seoAvgPagesPerAnalysis =
		seoTotalAnalyses > 0 ? seoPagesAnalyzed / seoTotalAnalyses : 0;
	const seoUniqueUrlRatio =
		seoPagesAnalyzed > 0 ? seoUniqueUrls / seoPagesAnalyzed : 0;

	return (
		<div className='space-y-6'>
			<div className='flex items-end justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>
						Dashboard Overview
					</h1>
					<p className='text-sm text-muted-foreground mt-1'>
						Real-time snapshot of your leads, SEO activity, and connected
						channels.
					</p>
				</div>
				<Link to='/dashboard/lead-generation/overview'>
					<Button size='sm'>
						<Users
							size={16}
							className='mr-2'
						/>
						Open Lead Workspace
					</Button>
				</Link>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<StatCard
					title='Total Leads'
					value={String(totalLeads)}
					desc={`${leadCounts.saved} saved, ${leadCounts.processed} processed`}
				/>
				<StatCard
					title='Lead Conversion'
					value={`${conversionRate}%`}
					desc={`${leadCounts.converted} converted out of ${totalLeads}`}
				/>
				<StatCard
					title='Connected Channels'
					value={String(connectedChannels)}
					desc='Instagram, Facebook, LinkedIn, TikTok'
				/>
			</div>

			<div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden min-h-100'>
				<div className='p-1 flex items-center border-b border-border bg-muted/20'>
					<div className='flex text-sm font-medium'>
						<button className='px-4 py-2 text-foreground bg-background rounded-md shadow-sm border border-border/50'>
							Overview
						</button>
					</div>
				</div>
				<div className='p-6'>
					<div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
						<div className='rounded-lg border border-border p-5 xl:col-span-2'>
							<div className='flex items-center justify-between'>
								<div>
									<h3 className='font-semibold'>Lead Pipeline Status</h3>
									<p className='text-xs text-muted-foreground mt-1'>
										Current distribution across your CRM stages
									</p>
								</div>
								<PieChart size={18} className='text-muted-foreground' />
							</div>

							<div className='mt-4 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center'>
								<div className='flex items-center justify-center'>
									<DonutChart
										segments={
											leadStatusSegments.length > 0
												? leadStatusSegments
												: [
														{
															label: 'No data',
															value: 1,
															colorVar: '--border',
														},
													]
										}
										centerValue={String(totalLeads)}
										centerLabel='leads'
										ariaLabel='Lead status distribution'
									/>
								</div>

								<div className='space-y-3'>
									{(
										[
											{
												label: 'Saved',
												value: leadCounts.saved,
												colorVar: '--chart-1' as const,
											},
											{
												label: 'Processed',
												value: leadCounts.processed,
												colorVar: '--chart-2' as const,
											},
											{
												label: 'Converted',
												value: leadCounts.converted,
												colorVar: '--chart-3' as const,
											},
											{
												label: 'Rejected',
												value: leadCounts.rejected,
												colorVar: '--chart-5' as const,
											},
										] as const
									).map((row) => (
										<div key={row.label} className='grid grid-cols-[88px_1fr_40px] gap-3 items-center text-sm'>
											<div className='flex items-center gap-2'>
												<span
													className='h-2.5 w-2.5 rounded-full'
													style={{ background: `var(${row.colorVar})` }}
												/>
												<span className='text-muted-foreground'>{row.label}</span>
											</div>
											<ProgressBar
												value={totalLeads > 0 ? row.value / totalLeads : 0}
												colorVar={row.colorVar}
											/>
											<div className='text-right font-semibold tabular-nums'>
												{row.value}
											</div>
										</div>
									))}

									<div className='pt-2 grid grid-cols-2 gap-3'>
										<div className='rounded-md bg-muted/40 p-3'>
											<div className='text-muted-foreground text-xs'>Conversion</div>
											<div className='text-lg font-semibold'>{conversionRate}%</div>
											<div className='text-xs text-muted-foreground mt-1'>
												{leadCounts.converted} converted
											</div>
										</div>
										<div className='rounded-md bg-muted/40 p-3'>
											<div className='text-muted-foreground text-xs'>Avg rating</div>
											<div className='text-lg font-semibold'>
												{avgRating ? avgRating.toFixed(1) : '—'}
											</div>
											<div className='text-xs text-muted-foreground mt-1'>
												From rated leads only
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className='rounded-lg border border-border p-5'>
							<div className='flex items-center justify-between'>
								<div>
									<h3 className='font-semibold'>Lead Activity</h3>
									<p className='text-xs text-muted-foreground mt-1'>
										New leads captured in the last 14 days
									</p>
								</div>
								<Activity size={18} className='text-muted-foreground' />
							</div>

							<div className='mt-4 rounded-md bg-muted/30 border border-border/60 p-3'>
								<Sparkline
									data={leadActivitySeries.map((d) => d.count)}
									width={320}
									height={92}
									strokeVar='--chart-2'
									fillVar='--chart-2'
									ariaLabel='Lead activity trend'
									className='w-full h-[92px]'
								/>
							</div>

							<div className='mt-3 grid grid-cols-2 gap-3 text-sm'>
								<div className='rounded-md bg-muted/40 p-3'>
									<div className='text-muted-foreground text-xs'>Last 7 days</div>
									<div className='text-lg font-semibold tabular-nums'>
										{leadsLast7Days}
									</div>
									<div className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
										{wowDelta === null ? (
											<span>Not enough history</span>
										) : wowDelta >= 0 ? (
											<>
												<TrendingUp size={14} style={{ color: 'var(--chart-3)' }} />
												<span className='tabular-nums'>
													+{Math.round(wowDelta * 100)}% WoW
												</span>
											</>
										) : (
											<>
												<TrendingDown size={14} style={{ color: 'var(--chart-5)' }} />
												<span className='tabular-nums'>
													{Math.round(wowDelta * 100)}% WoW
												</span>
											</>
										)}
									</div>
								</div>
								<div className='rounded-md bg-muted/40 p-3'>
									<div className='text-muted-foreground text-xs'>Today</div>
									<div className='text-lg font-semibold tabular-nums'>
										{leadActivitySeries[leadActivitySeries.length - 1]?.count ?? 0}
									</div>
									<div className='text-xs text-muted-foreground mt-1'>
										{leadActivitySeries[leadActivitySeries.length - 1]?.key ?? ''}
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className='mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4'>
						<div className='rounded-lg border border-border p-5'>
							<div className='flex items-center justify-between'>
								<div>
									<h3 className='font-semibold'>SEO Snapshot</h3>
									<p className='text-xs text-muted-foreground mt-1'>
										Usage tracked from SEO Rocket
									</p>
								</div>
								<Globe2 size={18} className='text-muted-foreground' />
							</div>

							<div className='mt-4 space-y-2 text-sm'>
								<div className='flex items-center justify-between rounded-md bg-muted/40 px-3 py-2'>
									<span>Total analyses</span>
									<span className='font-semibold tabular-nums'>{seoTotalAnalyses}</span>
								</div>
								<div className='flex items-center justify-between rounded-md bg-muted/40 px-3 py-2'>
									<span>Pages analyzed</span>
									<span className='font-semibold tabular-nums'>{seoPagesAnalyzed}</span>
								</div>
								<div className='flex items-center justify-between rounded-md bg-muted/40 px-3 py-2'>
									<span>Unique URLs</span>
									<span className='font-semibold tabular-nums'>{seoUniqueUrls}</span>
								</div>
							</div>

							<div className='mt-3 space-y-3'>
								<div className='rounded-md border border-border/60 bg-muted/25 p-3'>
									<div className='flex items-center justify-between text-xs text-muted-foreground'>
										<span>Avg pages per analysis</span>
										<span className='font-medium text-foreground tabular-nums'>
											{seoAvgPagesPerAnalysis.toFixed(1)}
										</span>
									</div>
									<ProgressBar
										value={Math.min(1, seoAvgPagesPerAnalysis / 10)}
										colorVar='--chart-4'
										className='mt-2'
									/>
									<div className='text-[11px] text-muted-foreground mt-1'>
										Visualized against a 10-page target
									</div>
								</div>
								<div className='rounded-md border border-border/60 bg-muted/25 p-3'>
									<div className='flex items-center justify-between text-xs text-muted-foreground'>
										<span>Unique URL ratio</span>
										<span className='font-medium text-foreground tabular-nums'>
											{Math.round(seoUniqueUrlRatio * 100)}%
										</span>
									</div>
									<ProgressBar
										value={seoUniqueUrlRatio}
										colorVar='--chart-2'
										className='mt-2'
									/>
									<div className='text-[11px] text-muted-foreground mt-1'>
										Unique URLs / pages analyzed
									</div>
								</div>
							</div>
						</div>

						<div className='rounded-lg border border-border p-5'>
							<div className='flex items-center justify-between'>
								<div>
									<h3 className='font-semibold'>Channel Health</h3>
									<p className='text-xs text-muted-foreground mt-1'>
										Connected channels and readiness
									</p>
								</div>
								<PlugZap size={18} className='text-muted-foreground' />
							</div>

							<div className='mt-4 flex items-center justify-between gap-4'>
								<DonutChart
									segments={[
										{
											label: 'Connected',
											value: connectedChannels,
											colorVar: '--chart-3',
										},
										{
											label: 'Remaining',
											value: Math.max(0, 4 - connectedChannels),
											colorVar: '--border',
										},
									]}
									centerValue={`${connectedChannels}/4`}
									centerLabel='connected'
									ariaLabel='Connected channels'
									size={104}
									thickness={12}
								/>
								<div className='flex-1 space-y-2 text-sm'>
									{(
										[
											{
												name: 'Instagram',
												connected: Boolean(socialData?.insta_auth_token),
												colorVar: '--chart-1' as const,
											},
											{
												name: 'Facebook',
												connected: Boolean(socialData?.meta_auth_token),
												colorVar: '--chart-2' as const,
											},
											{
												name: 'LinkedIn',
												connected: Boolean(socialData?.linkedin_auth_token),
												colorVar: '--chart-4' as const,
											},
											{
												name: 'TikTok',
												connected: Boolean(socialData?.tiktok_auth_token),
												colorVar: '--chart-5' as const,
											},
										] as const
									).map((ch) => (
										<div key={ch.name} className='flex items-center justify-between rounded-md bg-muted/40 px-3 py-2'>
											<div className='flex items-center gap-2'>
												<span
													className='h-2 w-2 rounded-full'
													style={{
														background: ch.connected ? `var(${ch.colorVar})` : 'var(--border)',
													}}
												/>
												<span className='text-muted-foreground'>{ch.name}</span>
											</div>
											<span className={cn('text-xs font-medium', ch.connected ? 'text-foreground' : 'text-muted-foreground')}>
												{ch.connected ? 'Connected' : 'Not connected'}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className='rounded-lg border border-border p-5'>
							<div className='flex items-center justify-between'>
								<div>
									<h3 className='font-semibold'>Top Categories</h3>
									<p className='text-xs text-muted-foreground mt-1'>
										Most frequent lead categories
									</p>
								</div>
								<Tags size={18} className='text-muted-foreground' />
							</div>

							<div className='mt-4 space-y-3'>
								{topCategories.length > 0 ? (
									topCategories.map((c, idx) => {
										const colorVars = ['--chart-1', '--chart-2', '--chart-3', '--chart-4'] as const;
										const colorVar = colorVars[idx] ?? '--chart-1';
										return (
											<div key={c.name} className='space-y-1'>
												<div className='flex items-center justify-between text-sm'>
													<span className='text-muted-foreground'>{c.name}</span>
													<span className='font-semibold tabular-nums'>{c.count}</span>
												</div>
												<ProgressBar
													value={totalLeads > 0 ? c.count / totalLeads : 0}
													colorVar={colorVar}
												/>
											</div>
										);
									})
								) : (
									<div className='rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground'>
										Add a few leads to see category insights here.
									</div>
								)}

								<div className='rounded-md bg-muted/30 border border-border/60 p-3 text-sm'>
									<div className='flex items-center justify-between'>
										<span className='text-muted-foreground'>Processed + converted</span>
										<span className='font-semibold tabular-nums'>
											{leadCounts.processed + leadCounts.converted}
										</span>
									</div>
									<ProgressBar
										value={totalLeads > 0 ? (leadCounts.processed + leadCounts.converted) / totalLeads : 0}
										colorVar='--chart-3'
										className='mt-2'
									/>
								</div>
							</div>
						</div>
					</div>

					<div className='mt-4 rounded-lg border border-dashed border-border p-5'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<div>
								<h3 className='font-semibold flex items-center gap-2'>
									<CheckCircle2 size={16} className='text-primary' />
									Account & Actions
								</h3>
								<p className='text-sm text-muted-foreground mt-1'>
									Signed in as {authUser?.email || 'Unknown user'}
								</p>
							</div>
							<div className='flex flex-wrap gap-2'>
								<Link to='/dashboard/seo-rocket'>
									<Button variant='outline' size='sm'>
										SEO Rocket <ArrowRight size={14} className='ml-2' />
									</Button>
								</Link>
								<Link to='/dashboard/profile'>
									<Button variant='outline' size='sm'>
										Profile <ArrowRight size={14} className='ml-2' />
									</Button>
								</Link>
							</div>
						</div>

						<div className='mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground'>
							<span className='rounded-full bg-muted px-2 py-1'>
								Plan: {authUser?.subscriptionPlan || 'free'}
							</span>
							<span className='rounded-full bg-muted px-2 py-1'>
								Email verified: {authUser?.emailVerified ? 'Yes' : 'No'}
							</span>
							<span className='rounded-full bg-muted px-2 py-1'>
								Channels connected: {connectedChannels}
							</span>
						</div>
					</div>

					<div className='mt-4 rounded-lg border border-border p-5'>
						<div className='flex items-center justify-between gap-3 mb-2'>
							<div>
								<h3 className='font-semibold'>WhatsApp Web</h3>
								<p className='text-xs text-muted-foreground'>
									Connect WhatsApp to send messages directly from your workflow
								</p>
							</div>
							<Link to='/dashboard/profile/whatsapp'>
								<Button variant='outline' size='sm'>
									Manage
								</Button>
							</Link>
						</div>
						<WhatsAppConnectionPanel />
					</div>
				</div>
			</div>
		</div>
	);
}
