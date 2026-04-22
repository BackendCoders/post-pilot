import { Link } from 'react-router-dom';
import {
	Users,
	TrendingUp,
	TrendingDown,
	Star,
	FolderOpen,
	Activity,
	PieChart,
	Tags,
	ArrowRight,
	Search,
	MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeads } from '@/query/leads.query';
import { useGetLeadCategory } from '@/query/leadsCategory.query';
import DonutChart from '@/components/charts/DonutChart';
import Sparkline from '@/components/charts/Sparkline';

/* ── helpers ── */

function formatDayKey(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function startOfDay(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getLeadDate(lead: LeadLike): Date | null {
	const dtRaw = lead.createdAt ?? lead.updatedAt;
	if (!dtRaw) return null;
	const dt = dtRaw instanceof Date ? dtRaw : new Date(String(dtRaw));
	if (Number.isNaN(dt.getTime())) return null;
	return dt;
}

function relativeTime(dateStr: string | Date | undefined): string {
	if (!dateStr) return '—';
	const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
	if (Number.isNaN(d.getTime())) return '—';
	const diff = Date.now() - d.getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return 'Just now';
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	if (days < 7) return `${days}d ago`;
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── types ── */

type LeadLike = {
	_id?: string;
	title?: string;
	status?: string;
	rating?: number;
	ratingCount?: number;
	category?: string;
	address?: string;
	phone?: string;
	website?: string;
	createdAt?: string | Date;
	updatedAt?: string | Date;
};

/* ── sub-components ── */

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
				className='h-full rounded-full transition-all duration-500'
				style={{ width: `${pct * 100}%`, background: `var(${colorVar})` }}
			/>
		</div>
	);
}

function KpiCard({
	title,
	value,
	desc,
	icon: Icon,
	iconColor = 'text-primary',
}: {
	title: string;
	value: string;
	desc: string;
	icon: React.ElementType;
	iconColor?: string;
}) {
	return (
		<div className='p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow'>
			<div className='flex items-center justify-between'>
				<h3 className='text-sm font-medium text-muted-foreground'>{title}</h3>
				<div
					className={cn(
						'w-9 h-9 rounded-lg flex items-center justify-center bg-primary/5',
						iconColor,
					)}
				>
					<Icon size={18} />
				</div>
			</div>
			<div className='mt-3'>
				<span className='text-2xl font-bold tracking-tight'>{value}</span>
			</div>
			<p className='text-xs text-muted-foreground mt-1'>{desc}</p>
		</div>
	);
}

const STATUS_COLORS = {
	saved: '--chart-1',
	processed: '--chart-2',
	converted: '--chart-3',
	rejected: '--chart-5',
} as const;

/* ── main page ── */

export default function LeadOverview() {
	const { data: leadsResponse, isLoading } = useLeads();
	const { data: categoriesResponse } = useGetLeadCategory();

	const leads = (
		Array.isArray(leadsResponse?.data) ? leadsResponse.data : []
	) as LeadLike[];
	const categories = categoriesResponse?.data || [];
	const totalLeads = leads.length;

	/* ── computed metrics ── */

	const statusCounts = leads.reduce(
		(acc, lead) => {
			const s = String(lead?.status || '').toLowerCase();
			if (s in acc) acc[s as keyof typeof acc] += 1;
			return acc;
		},
		{ saved: 0, processed: 0, converted: 0, rejected: 0 },
	);

	const conversionRate =
		totalLeads > 0
			? ((statusCounts.converted / totalLeads) * 100).toFixed(1)
			: '0.0';

	const avgRating = (() => {
		const rated = leads
			.map((l) => (typeof l?.rating === 'number' ? l.rating : null))
			.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
		if (rated.length === 0) return null;
		return rated.reduce((a, b) => a + b, 0) / rated.length;
	})();

	/* ── donut segments ── */

	const donutSegments = (
		[
			{ label: 'Saved', value: statusCounts.saved, colorVar: '--chart-1' as const },
			{ label: 'Processed', value: statusCounts.processed, colorVar: '--chart-2' as const },
			{ label: 'Converted', value: statusCounts.converted, colorVar: '--chart-3' as const },
			{ label: 'Rejected', value: statusCounts.rejected, colorVar: '--chart-5' as const },
		] as const
	).filter((s) => s.value > 0);

	/* ── sparkline (14-day activity) ── */

	const activitySeries = (() => {
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

	const leadsLast7 = activitySeries.slice(-7).reduce((s, d) => s + d.count, 0);
	const leadsPrev7 = activitySeries.slice(0, 7).reduce((s, d) => s + d.count, 0);
	const wowDelta = leadsPrev7 > 0 ? (leadsLast7 - leadsPrev7) / leadsPrev7 : null;

	/* ── top categories ── */

	const topCategories = (() => {
		const counts = new Map<string, number>();
		for (const lead of leads) {
			const raw = (lead?.category ?? '').toString().trim();
			if (!raw) continue;
			const key = raw.length > 24 ? `${raw.slice(0, 24)}…` : raw;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return [...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([name, count]) => ({ name, count }));
	})();

	/* ── recent leads ── */

	const recentLeads = [...leads]
		.sort((a, b) => {
			const da = getLeadDate(a)?.getTime() ?? 0;
			const db = getLeadDate(b)?.getTime() ?? 0;
			return db - da;
		})
		.slice(0, 6);

	/* ── loading state ── */

	if (isLoading) {
		return (
			<div className='flex items-center justify-center min-h-[50vh]'>
				<div className='animate-pulse text-muted-foreground text-sm'>
					Loading analytics…
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-end justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>
						Lead Generation Overview
					</h1>
					<p className='text-sm text-muted-foreground mt-1'>
						Pipeline health, activity trends, and key metrics at a glance.
					</p>
				</div>
				<Link to='/dashboard/lead-generation/scrape'>
					<button className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all'>
						<Search size={16} />
						Scrape Leads
					</button>
				</Link>
			</div>

			{/* KPI Cards */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
				<KpiCard
					title='Total Leads'
					value={String(totalLeads)}
					desc={`${statusCounts.saved} saved, ${statusCounts.processed} processed`}
					icon={Users}
					iconColor='text-blue-500'
				/>
				<KpiCard
					title='Conversion Rate'
					value={`${conversionRate}%`}
					desc={`${statusCounts.converted} converted of ${totalLeads}`}
					icon={TrendingUp}
					iconColor='text-emerald-500'
				/>
				<KpiCard
					title='Avg Rating'
					value={avgRating ? avgRating.toFixed(1) : '—'}
					desc='From rated leads only'
					icon={Star}
					iconColor='text-amber-500'
				/>
				<KpiCard
					title='Categories'
					value={String(categories.length)}
					desc={`${topCategories.length} active categories`}
					icon={FolderOpen}
					iconColor='text-violet-500'
				/>
			</div>

			{/* Main Grid */}
			<div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
				{/* Pipeline Donut */}
				<div className='rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-2'>
					<div className='flex items-center justify-between'>
						<div>
							<h3 className='font-semibold'>Lead Pipeline</h3>
							<p className='text-xs text-muted-foreground mt-1'>
								Current distribution across CRM stages
							</p>
						</div>
						<PieChart size={18} className='text-muted-foreground' />
					</div>

					<div className='mt-5 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-center'>
						<div className='flex items-center justify-center'>
							<DonutChart
								segments={
									donutSegments.length > 0
										? donutSegments
										: [{ label: 'No data', value: 1, colorVar: '--border' }]
								}
								centerValue={String(totalLeads)}
								centerLabel='leads'
								ariaLabel='Lead pipeline distribution'
							/>
						</div>

						<div className='space-y-3'>
							{(
								[
									{ label: 'Saved', key: 'saved', colorVar: '--chart-1' },
									{ label: 'Processed', key: 'processed', colorVar: '--chart-2' },
									{ label: 'Converted', key: 'converted', colorVar: '--chart-3' },
									{ label: 'Rejected', key: 'rejected', colorVar: '--chart-5' },
								] as const
							).map((row) => (
								<div
									key={row.label}
									className='grid grid-cols-[88px_1fr_40px] gap-3 items-center text-sm'
								>
									<div className='flex items-center gap-2'>
										<span
											className='h-2.5 w-2.5 rounded-full'
											style={{ background: `var(${row.colorVar})` }}
										/>
										<span className='text-muted-foreground'>{row.label}</span>
									</div>
									<ProgressBar
										value={totalLeads > 0 ? statusCounts[row.key] / totalLeads : 0}
										colorVar={row.colorVar}
									/>
									<div className='text-right font-semibold tabular-nums'>
										{statusCounts[row.key]}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Activity Sparkline */}
				<div className='rounded-xl border border-border bg-card p-5 shadow-sm'>
					<div className='flex items-center justify-between'>
						<div>
							<h3 className='font-semibold'>Lead Activity</h3>
							<p className='text-xs text-muted-foreground mt-1'>
								Last 14 days
							</p>
						</div>
						<Activity size={18} className='text-muted-foreground' />
					</div>

					<div className='mt-4 rounded-lg bg-muted/30 border border-border/60 p-3'>
						<Sparkline
							data={activitySeries.map((d) => d.count)}
							width={320}
							height={92}
							strokeVar='--chart-2'
							fillVar='--chart-2'
							ariaLabel='Lead activity trend'
							className='w-full h-[92px]'
						/>
					</div>

					<div className='mt-3 grid grid-cols-2 gap-3 text-sm'>
						<div className='rounded-lg bg-muted/40 p-3'>
							<div className='text-muted-foreground text-xs'>Last 7 days</div>
							<div className='text-lg font-semibold tabular-nums'>{leadsLast7}</div>
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
						<div className='rounded-lg bg-muted/40 p-3'>
							<div className='text-muted-foreground text-xs'>Today</div>
							<div className='text-lg font-semibold tabular-nums'>
								{activitySeries[activitySeries.length - 1]?.count ?? 0}
							</div>
							<div className='text-xs text-muted-foreground mt-1'>
								{activitySeries[activitySeries.length - 1]?.key ?? ''}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Second Row */}
			<div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
				{/* Top Categories */}
				<div className='rounded-xl border border-border bg-card p-5 shadow-sm'>
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
								const colorVars = [
									'--chart-1',
									'--chart-2',
									'--chart-3',
									'--chart-4',
									'--chart-5',
								] as const;
								return (
									<div key={c.name} className='space-y-1'>
										<div className='flex items-center justify-between text-sm'>
											<span className='text-muted-foreground'>{c.name}</span>
											<span className='font-semibold tabular-nums'>{c.count}</span>
										</div>
										<ProgressBar
											value={totalLeads > 0 ? c.count / totalLeads : 0}
											colorVar={colorVars[idx] ?? '--chart-1'}
										/>
									</div>
								);
							})
						) : (
							<div className='rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground text-center'>
								No categories yet. Scrape leads to get started.
							</div>
						)}
					</div>
				</div>

				{/* Recent Leads */}
				<div className='rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-2'>
					<div className='flex items-center justify-between'>
						<div>
							<h3 className='font-semibold'>Recent Leads</h3>
							<p className='text-xs text-muted-foreground mt-1'>
								Latest leads in your pipeline
							</p>
						</div>
						<Link
							to='/dashboard/lead-generation/manage-saved-leads'
							className='text-xs text-primary hover:underline flex items-center gap-1'
						>
							View all <ArrowRight size={12} />
						</Link>
					</div>

					{recentLeads.length > 0 ? (
						<div className='mt-4 overflow-x-auto'>
							<table className='w-full text-sm'>
								<thead>
									<tr className='border-b border-border text-muted-foreground'>
										<th className='text-left py-2 pr-4 font-medium'>Name</th>
										<th className='text-left py-2 pr-4 font-medium hidden sm:table-cell'>
											Address
										</th>
										<th className='text-left py-2 pr-4 font-medium'>Status</th>
										<th className='text-left py-2 pr-4 font-medium hidden md:table-cell'>
											Rating
										</th>
										<th className='text-right py-2 font-medium'>Added</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-border/60'>
									{recentLeads.map((lead, i) => {
										const status = String(lead.status || 'saved').toLowerCase();
										const colorVar =
											STATUS_COLORS[status as keyof typeof STATUS_COLORS] ??
											'--chart-1';
										return (
											<tr key={lead._id || i} className='hover:bg-muted/30 transition-colors'>
												<td className='py-2.5 pr-4'>
													<span className='font-medium truncate block max-w-[200px]'>
														{lead.title || 'Untitled'}
													</span>
												</td>
												<td className='py-2.5 pr-4 text-muted-foreground truncate max-w-[180px] hidden sm:table-cell'>
													<span className='flex items-center gap-1'>
														<MapPin size={12} className='shrink-0' />
														{lead.address || '—'}
													</span>
												</td>
												<td className='py-2.5 pr-4'>
													<span
														className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium'
														style={{
															background: `color-mix(in srgb, var(${colorVar}) 12%, transparent)`,
															color: `var(${colorVar})`,
														}}
													>
														<span
															className='w-1.5 h-1.5 rounded-full'
															style={{ background: `var(${colorVar})` }}
														/>
														{status.charAt(0).toUpperCase() + status.slice(1)}
													</span>
												</td>
												<td className='py-2.5 pr-4 hidden md:table-cell'>
													{typeof lead.rating === 'number' ? (
														<span className='flex items-center gap-1 text-amber-500'>
															<Star size={12} className='fill-current' />
															{lead.rating.toFixed(1)}
														</span>
													) : (
														<span className='text-muted-foreground'>—</span>
													)}
												</td>
												<td className='py-2.5 text-right text-muted-foreground text-xs'>
													{relativeTime(lead.createdAt as string | undefined)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					) : (
						<div className='mt-4 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground text-center'>
							No leads yet. Start scraping to build your pipeline.
						</div>
					)}
				</div>
			</div>

			{/* Quick Actions */}
			<div className='rounded-xl border border-dashed border-border bg-card/50 p-5'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div>
						<h3 className='font-semibold flex items-center gap-2'>
							<Users size={16} className='text-primary' />
							Quick Actions
						</h3>
						<p className='text-sm text-muted-foreground mt-1'>
							Jump to common lead generation tasks
						</p>
					</div>
					<div className='flex flex-wrap gap-2'>
						<Link to='/dashboard/lead-generation/scrape'>
							<button className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted transition-all'>
								Scrape Leads <ArrowRight size={14} />
							</button>
						</Link>
						<Link to='/dashboard/lead-generation/manage-saved-leads'>
							<button className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted transition-all'>
								Manage Saved <ArrowRight size={14} />
							</button>
						</Link>
						<Link to='/dashboard/lead-generation/template'>
							<button className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted transition-all'>
								Message Templates <ArrowRight size={14} />
							</button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
