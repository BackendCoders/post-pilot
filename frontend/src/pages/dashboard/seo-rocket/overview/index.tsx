import { Link } from 'react-router-dom';
import {
	Globe2,
	Rocket,
	FileSearch,
	TrendingUp,
	BarChart3,
	Activity,
	ArrowRight,
	ExternalLink,
	Clock,
	CheckCircle2,
	XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserSeoStats, useAnalysisHistory } from '@/query/seo-analysis.query';
import DonutChart from '@/components/charts/DonutChart';
import Sparkline from '@/components/charts/Sparkline';

/* ── helpers ── */

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

function relativeTime(dateStr: string | undefined): string {
	if (!dateStr) return '—';
	const d = new Date(dateStr);
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

function formatDayKey(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function startOfDay(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
	single_page: 'Single Page',
	full_site: 'Full Site',
	partial_site: 'Partial Site',
};

const ANALYSIS_TYPE_COLORS: Record<string, `--${string}`> = {
	single_page: '--chart-1',
	full_site: '--chart-3',
	partial_site: '--chart-4',
};

/* ── main page ── */

export default function SeoOverview() {
	const { data: stats, isLoading: statsLoading } = useUserSeoStats();
	const { data: historyData, isLoading: historyLoading } = useAnalysisHistory({
		page: 1,
		limit: 50,
	});

	const isLoading = statsLoading || historyLoading;

	const totalAnalyses = stats?.totalAnalyses ?? 0;
	const pagesAnalyzed = stats?.totalPagesAnalyzed ?? 0;
	const uniqueUrls = stats?.uniqueUrlsAnalyzed ?? 0;
	const singlePage = stats?.singlePageAnalyses ?? 0;
	const fullSite = stats?.fullSiteAnalyses ?? 0;
	const partialSite = stats?.partialSiteAnalyses ?? 0;
	const avgPagesPerAnalysis =
		totalAnalyses > 0 ? pagesAnalyzed / totalAnalyses : 0;
	const uniqueUrlRatio = pagesAnalyzed > 0 ? uniqueUrls / pagesAnalyzed : 0;

	const analyses = (historyData?.analyses ?? []) as Array<{
		_id: string;
		requestedUrl: string;
		analysisType: string;
		totalPagesAnalyzed: number;
		successfulPages: number;
		failedPages: number;
		createdAt: string;
	}>;

	/* ── donut: analysis types ── */

	const typeSegments = [
		{ label: 'Single Page', value: singlePage, colorVar: '--chart-1' as const },
		{ label: 'Full Site', value: fullSite, colorVar: '--chart-3' as const },
		{ label: 'Partial Site', value: partialSite, colorVar: '--chart-4' as const },
	].filter((s) => s.value > 0);

	/* ── sparkline: analysis activity (14 days) ── */

	const activitySeries = (() => {
		const now = new Date();
		const end = startOfDay(now);
		const start = new Date(end);
		start.setDate(start.getDate() - 13);

		const counts = new Map<string, number>();
		for (const a of analyses) {
			if (!a.createdAt) continue;
			const dt = startOfDay(new Date(a.createdAt));
			if (dt < start || dt > end) continue;
			const key = formatDayKey(dt);
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

	const analysesLast7 = activitySeries
		.slice(-7)
		.reduce((s, d) => s + d.count, 0);

	/* ── recent analyses ── */

	const recentAnalyses = analyses.slice(0, 6);

	/* ── loading ── */

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
						SEO Rocket Overview
					</h1>
					<p className='text-sm text-muted-foreground mt-1'>
						Analysis stats, activity trends, and recent audits at a glance.
					</p>
				</div>
				<Link to='/dashboard/seo-rocket'>
					<button className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all'>
						<Rocket size={16} />
						New Analysis
					</button>
				</Link>
			</div>

			{/* KPI Cards */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
				<KpiCard
					title='Total Analyses'
					value={String(totalAnalyses)}
					desc={`${singlePage} single · ${fullSite} full site`}
					icon={BarChart3}
					iconColor='text-blue-500'
				/>
				<KpiCard
					title='Pages Analyzed'
					value={String(pagesAnalyzed)}
					desc={`Avg ${avgPagesPerAnalysis.toFixed(1)} pages per analysis`}
					icon={FileSearch}
					iconColor='text-emerald-500'
				/>
				<KpiCard
					title='Unique URLs'
					value={String(uniqueUrls)}
					desc={`${Math.round(uniqueUrlRatio * 100)}% unique ratio`}
					icon={Globe2}
					iconColor='text-violet-500'
				/>
				<KpiCard
					title='Last 7 Days'
					value={String(analysesLast7)}
					desc='Analyses this week'
					icon={TrendingUp}
					iconColor='text-amber-500'
				/>
			</div>

			{/* Main Grid */}
			<div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
				{/* Analysis Type Donut */}
				<div className='rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-2'>
					<div className='flex items-center justify-between'>
						<div>
							<h3 className='font-semibold'>Analysis Breakdown</h3>
							<p className='text-xs text-muted-foreground mt-1'>
								Distribution by analysis type
							</p>
						</div>
						<BarChart3 size={18} className='text-muted-foreground' />
					</div>

					<div className='mt-5 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-center'>
						<div className='flex items-center justify-center'>
							<DonutChart
								segments={
									typeSegments.length > 0
										? typeSegments
										: [{ label: 'No data', value: 1, colorVar: '--border' }]
								}
								centerValue={String(totalAnalyses)}
								centerLabel='analyses'
								ariaLabel='Analysis type distribution'
							/>
						</div>

						<div className='space-y-4'>
							{(
								[
									{ label: 'Single Page', key: 'single_page', value: singlePage, colorVar: '--chart-1' },
									{ label: 'Full Site', key: 'full_site', value: fullSite, colorVar: '--chart-3' },
									{ label: 'Partial Site', key: 'partial_site', value: partialSite, colorVar: '--chart-4' },
								] as const
							).map((row) => (
								<div
									key={row.key}
									className='grid grid-cols-[100px_1fr_40px] gap-3 items-center text-sm'
								>
									<div className='flex items-center gap-2'>
										<span
											className='h-2.5 w-2.5 rounded-full'
											style={{ background: `var(${row.colorVar})` }}
										/>
										<span className='text-muted-foreground'>{row.label}</span>
									</div>
									<ProgressBar
										value={totalAnalyses > 0 ? row.value / totalAnalyses : 0}
										colorVar={row.colorVar}
									/>
									<div className='text-right font-semibold tabular-nums'>
										{row.value}
									</div>
								</div>
							))}

							{/* Extra metrics */}
							<div className='pt-2 grid grid-cols-2 gap-3'>
								<div className='rounded-lg bg-muted/40 p-3'>
									<div className='text-muted-foreground text-xs'>
										Avg pages / analysis
									</div>
									<div className='text-lg font-semibold'>
										{avgPagesPerAnalysis.toFixed(1)}
									</div>
								</div>
								<div className='rounded-lg bg-muted/40 p-3'>
									<div className='text-muted-foreground text-xs'>
										Unique URL ratio
									</div>
									<div className='text-lg font-semibold'>
										{Math.round(uniqueUrlRatio * 100)}%
									</div>
									<ProgressBar
										value={uniqueUrlRatio}
										colorVar='--chart-2'
										className='mt-2'
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Activity Sparkline */}
				<div className='rounded-xl border border-border bg-card p-5 shadow-sm'>
					<div className='flex items-center justify-between'>
						<div>
							<h3 className='font-semibold'>Analysis Activity</h3>
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
							strokeVar='--chart-4'
							fillVar='--chart-4'
							ariaLabel='SEO analysis activity trend'
							className='w-full h-[92px]'
						/>
					</div>

					<div className='mt-3 grid grid-cols-2 gap-3 text-sm'>
						<div className='rounded-lg bg-muted/40 p-3'>
							<div className='text-muted-foreground text-xs'>This week</div>
							<div className='text-lg font-semibold tabular-nums'>
								{analysesLast7}
							</div>
							<div className='text-xs text-muted-foreground mt-1'>analyses</div>
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

			{/* Recent Analyses Table */}
			<div className='rounded-xl border border-border bg-card p-5 shadow-sm'>
				<div className='flex items-center justify-between'>
					<div>
						<h3 className='font-semibold'>Recent Analyses</h3>
						<p className='text-xs text-muted-foreground mt-1'>
							Your latest SEO audits
						</p>
					</div>
					<Link
						to='/dashboard/seo-rocket/history'
						className='text-xs text-primary hover:underline flex items-center gap-1'
					>
						View all <ArrowRight size={12} />
					</Link>
				</div>

				{recentAnalyses.length > 0 ? (
					<div className='mt-4 overflow-x-auto'>
						<table className='w-full text-sm'>
							<thead>
								<tr className='border-b border-border text-muted-foreground'>
									<th className='text-left py-2 pr-4 font-medium'>URL</th>
									<th className='text-left py-2 pr-4 font-medium hidden sm:table-cell'>
										Type
									</th>
									<th className='text-left py-2 pr-4 font-medium'>Pages</th>
									<th className='text-left py-2 pr-4 font-medium hidden md:table-cell'>
										Status
									</th>
									<th className='text-right py-2 font-medium'>Date</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-border/60'>
								{recentAnalyses.map((a) => {
									const type =
										ANALYSIS_TYPE_LABELS[a.analysisType] || a.analysisType;
									const colorVar =
										ANALYSIS_TYPE_COLORS[a.analysisType] || '--chart-1';
									const hasFailures = (a.failedPages || 0) > 0;
									return (
										<tr
											key={a._id}
											className='hover:bg-muted/30 transition-colors'
										>
											<td className='py-2.5 pr-4'>
												<div className='flex items-center gap-2'>
													<Globe2 size={14} className='text-muted-foreground shrink-0' />
													<span className='font-medium truncate block max-w-[260px]'>
														{a.requestedUrl}
													</span>
													<a
														href={a.requestedUrl}
														target='_blank'
														rel='noreferrer'
														className='shrink-0 text-muted-foreground hover:text-primary'
													>
														<ExternalLink size={12} />
													</a>
												</div>
											</td>
											<td className='py-2.5 pr-4 hidden sm:table-cell'>
												<span
													className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium'
													style={{
														background: `color-mix(in srgb, var(${colorVar}) 12%, transparent)`,
														color: `var(${colorVar})`,
													}}
												>
													{type}
												</span>
											</td>
											<td className='py-2.5 pr-4 tabular-nums font-medium'>
												{a.totalPagesAnalyzed}
											</td>
											<td className='py-2.5 pr-4 hidden md:table-cell'>
												{hasFailures ? (
													<span className='flex items-center gap-1 text-amber-500 text-xs'>
														<XCircle size={12} />
														{a.failedPages} failed
													</span>
												) : (
													<span className='flex items-center gap-1 text-emerald-500 text-xs'>
														<CheckCircle2 size={12} />
														All passed
													</span>
												)}
											</td>
											<td className='py-2.5 text-right text-muted-foreground text-xs'>
												<span className='flex items-center justify-end gap-1'>
													<Clock size={12} />
													{relativeTime(a.createdAt)}
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				) : (
					<div className='mt-4 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground text-center'>
						No analyses yet. Run your first SEO audit to see data here.
					</div>
				)}
			</div>

			{/* Quick Actions */}
			<div className='rounded-xl border border-dashed border-border bg-card/50 p-5'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div>
						<h3 className='font-semibold flex items-center gap-2'>
							<Rocket size={16} className='text-primary' />
							Quick Actions
						</h3>
						<p className='text-sm text-muted-foreground mt-1'>
							Jump to common SEO tasks
						</p>
					</div>
					<div className='flex flex-wrap gap-2'>
						<Link to='/dashboard/seo-rocket'>
							<button className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted transition-all'>
								New Analysis <ArrowRight size={14} />
							</button>
						</Link>
						<Link to='/dashboard/seo-rocket/history'>
							<button className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted transition-all'>
								View History <ArrowRight size={14} />
							</button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
