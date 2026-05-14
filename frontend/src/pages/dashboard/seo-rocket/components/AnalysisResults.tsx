import { useState, useEffect } from 'react';
import {
	BarChart3,
	AlertTriangle,
	CheckCircle,
	Image,
	Link as LinkIcon,
	FileText,
	Download,
	Send,
	ExternalLink,
	Gauge,
	ChevronLeft,
	ChevronRight,
	Mail,
	Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageAnalysisCard from './PageAnalysisCard';
import ShareViaWhatsApp from './ShareViaWhatsApp';
import {
	generateSeoReport,
	generateSeoReportBase64,
} from '@/utils/pdf.generator';
import { useWhatsAppStatus } from '@/query/whatsapp.query';
import { useSendEmailReport } from '@/query/seo-analysis.query';
import type { ScrapedPageData, SeoReport } from '@/types/seo.types';

interface AnalysisResultsProps {
	results: ScrapedPageData[];
	reports?: Record<string, SeoReport>;
	onRescrape?: (url: string) => void;
	rescrapingUrl?: string | null;
	analysisId?: string | null;
	pendingUrls?: string[];
	jobStatus?: 'idle' | 'processing' | 'completed' | 'failed';
	jobProgress?: number;
}

const RESULTS_PER_PAGE = 20;

export default function AnalysisResults({
	results,
	reports = {},
	onRescrape,
	rescrapingUrl,
	analysisId,
	pendingUrls = [],
	jobStatus = 'idle',
	jobProgress = 0,
}: AnalysisResultsProps) {
	const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
	const [reportData, setReportData] = useState<{
		base64: string;
		fileName: string;
	} | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [visualProgress, setVisualProgress] = useState(jobProgress);

	// Smart Progress Logic: Increment randomly while processing
	useEffect(() => {
		if (jobStatus !== 'processing' || visualProgress >= 90) return;

		const timer = setInterval(() => {
			setVisualProgress((prev) => {
				// Don't go past 90 unless the real jobProgress is higher
				if (prev >= 90) return prev;

				const increment = Math.floor(Math.random() * 2) + 2; // 2-3%
				const next = prev + increment;
				return next > 90 ? 90 : next;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [jobStatus, visualProgress]);

	// Sync visual progress with real progress if real progress is higher
	useEffect(() => {
		if (jobProgress > visualProgress) {
			setVisualProgress(jobProgress);
		}
	}, [jobProgress, visualProgress]);

	const { data: whatsappStatus } = useWhatsAppStatus();
	const isWhatsAppConnected = whatsappStatus?.state === 'CONNECTED';

	const { mutate: sendEmail, isPending: isSendingEmail } = useSendEmailReport();

	const handleDownloadPdf = () => {
		generateSeoReport(results, reports);
	};

	const handleEmailReport = () => {
		if (!analysisId) {
			toast.error('Cannot email this report', {
				description: 'The analysis has not been saved yet.',
			});
			return;
		}

		sendEmail(
			{ analysisId },
			{
				onSuccess: () => {
					toast.success('Report emailed successfully', {
						description: 'The PDF report has been sent to your email address.',
					});
				},
				onError: (error: any) => {
					toast.error('Failed to send email', {
						description:
							error?.response?.data?.error || 'Unknown error occurred',
					});
				},
			},
		);
	};

	const handleShareWhatsApp = () => {
		if (!isWhatsAppConnected) {
			toast.error('WhatsApp not connected', {
				description: (
					<div className='space-y-2'>
						<p>Please connect your WhatsApp first.</p>
						<Button
							variant='outline'
							size='sm'
							className='w-full'
							onClick={() => {
								window.open('/dashboard/profile?section=whatsapp', '_blank');
							}}
						>
							<ExternalLink className='h-3 w-3 mr-2' />
							Go to Profile
						</Button>
					</div>
				),
				duration: 5000,
			});
			return;
		}

		const { base64, fileName } = generateSeoReportBase64(results, reports);
		setReportData({ base64, fileName });
		setShowWhatsAppDialog(true);
	};
	if (results.length === 0 && pendingUrls.length === 0) return null;

	const totalWords = results.reduce((sum, p) => sum + p.wordCount, 0);
	const totalImages = results.reduce((sum, p) => sum + p.images.length, 0);
	const totalImagesWithoutAlt = results.reduce(
		(sum, p) => sum + p.images.filter((img) => !img.alt).length,
		0,
	);
	const totalLinks = results.reduce(
		(sum, p) => sum + p.internalLinkCount + p.externalLinkCount,
		0,
	);
	const pagesWithMetaDesc = results.filter((p) => p.metaDescription).length;
	const pagesWithH1 = results.filter((p) => p.headings.h1.length > 0).length;
	const pagesWithHttps = results.filter((p) =>
		Boolean((p.finalUrl || p.url || '').startsWith('https://')),
	).length;
	const pagesWithCleanUrl = results.filter((p) => {
		const finalUrl = p.finalUrl || p.url || '';
		try {
			const parsed = new URL(finalUrl);
			const pathname = parsed.pathname || '';
			const hasUppercase = /[A-Z]/.test(pathname);
			const hasUnderscore = pathname.includes('_');
			const allowParam = (key: string) => {
				const lower = key.toLowerCase();
				return (
					lower.startsWith('utm_') || lower === 'gclid' || lower === 'fbclid'
				);
			};
			let hasDisallowedQueryParams = false;
			for (const key of parsed.searchParams.keys()) {
				if (!allowParam(key)) {
					hasDisallowedQueryParams = true;
					break;
				}
			}
			const isPathTooLong = pathname.length > 80;
			return (
				!hasUppercase &&
				!hasUnderscore &&
				!hasDisallowedQueryParams &&
				!isPathTooLong
			);
		} catch {
			return true;
		}
	}).length;
	const pagesWithCompleteOG = results.filter((p) =>
		Boolean(
			p.openGraph?.title && p.openGraph?.description && p.openGraph?.image,
		),
	).length;
	const pagesWithCompleteTwitter = results.filter((p) =>
		Boolean(
			p.twitterCard?.card &&
			p.twitterCard?.title &&
			p.twitterCard?.description &&
			p.twitterCard?.image,
		),
	).length;
	const pagesWithCompleteSocial = results.filter((p) =>
		Boolean(
			p.openGraph?.title &&
			p.openGraph?.description &&
			p.openGraph?.image &&
			p.twitterCard?.card &&
			p.twitterCard?.title &&
			p.twitterCard?.description &&
			p.twitterCard?.image,
		),
	).length;

	const pagesWithSchema = results.filter((p) =>
		Boolean(p.hasSchemaMarkup),
	).length;
	const pagesWithSchemaErrors = results.filter(
		(p) => (p.schemaErrors || []).length > 0,
	).length;
	const pagesWithBreadcrumbs = results.filter((p) =>
		Boolean(p.hasBreadcrumbSchema || p.hasBreadcrumbLinks),
	).length;
	const pagesWithHeavyInline = results.filter((p) => {
		const heavyInline =
			(p.largestInlineScriptBytes || 0) > 10_000 ||
			(p.inlineScriptsBytes || 0) > 30_000 ||
			(p.largestInlineStyleBytes || 0) > 5_000 ||
			(p.inlineStylesBytes || 0) > 15_000;
		return Boolean(heavyInline);
	}).length;
	const pagesWithGoodMinification = results.filter((p) => {
		const totalJs = p.totalJsCount || 0;
		const minJs = p.minifiedJsCount || 0;
		const totalCss = p.totalCssCount || 0;
		const minCss = p.minifiedCssCount || 0;
		const jsOk = totalJs > 0 ? minJs / totalJs >= 0.5 : true;
		const cssOk = totalCss > 0 ? minCss / totalCss >= 0.5 : true;
		return jsOk && cssOk;
	}).length;
	const avgWordCount =
		results.length > 0 ? Math.round(totalWords / results.length) : 0;

	const avgScore =
		Object.keys(reports).length > 0
			? Math.round(
					Object.values(reports).reduce((sum, r) => sum + r.totalScore, 0) /
						Object.keys(reports).length,
				)
			: null;

	const auditedPages = results.filter(
		(p) =>
			p.performanceMetrics &&
			(p.performanceMetrics.fcp ||
				p.performanceMetrics.overallPerformanceScore),
	);
	const pagesWithPerf = auditedPages.length;
	const avgLoadTime =
		pagesWithPerf > 0
			? Math.round(
					auditedPages.reduce(
						(sum, p) =>
							sum + (p.performanceMetrics?.desktop.totalLoadTime || 0),
						0,
					) / pagesWithPerf,
				)
			: 0;

	return (
		<div
			data-walkthrough='seo-results'
			className='space-y-6'
		>
			{/* Header Section */}
			<div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4'>
				<div className='space-y-1'>
					<h2 className='text-xl font-bold tracking-tight'>Analysis Results</h2>
					<p className='text-sm text-muted-foreground'>
						Overview of SEO metrics for your selected content.
					</p>
				</div>
				<div className='flex items-center gap-3'>
					<Button
						onClick={handleShareWhatsApp}
						variant='outline'
						size='sm'
						className='rounded-lg gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800'
					>
						<Send className='h-4 w-4' />
						Share via WhatsApp
					</Button>
					<Button
						onClick={handleEmailReport}
						variant='outline'
						size='sm'
						disabled={isSendingEmail || !analysisId}
						className='rounded-lg gap-2 border-primary/20 text-primary hover:bg-primary/5'
					>
						{isSendingEmail ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<Mail className='h-4 w-4' />
						)}
						Email Report
					</Button>
					<Button
						onClick={handleDownloadPdf}
						variant='outline'
						size='sm'
						className='rounded-lg gap-2'
					>
						<Download className='h-4 w-4' />
						Download PDF
					</Button>
					<Badge
						variant='secondary'
						className='w-fit rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider'
					>
						{results.length} {results.length === 1 ? 'Page' : 'Pages'} Analyzed
					</Badge>
				</div>
			</div>

			{/* Smart Progress Header (Top) */}
			{jobStatus === 'processing' && (
				<div className='mb-6 p-6 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col items-center justify-center space-y-4'>
					<div className='relative flex items-center justify-center'>
						<Loader2 className='h-10 w-10 text-primary animate-spin' />
						<span className='absolute text-[10px] font-bold text-primary'>
							{Math.round(visualProgress)}%
						</span>
					</div>
					<div className='text-center space-y-1'>
						<h3 className='text-sm font-bold text-foreground'>
							Analyzing website components...
						</h3>
						<p className='text-xs text-muted-foreground'>
							We are checking metadata, assets, and performance. Results are
							appearing in real-time.
						</p>
					</div>
					<div className='w-full max-w-md h-2 bg-muted rounded-full overflow-hidden'>
						<div
							className='h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]'
							style={{ width: `${visualProgress}%` }}
						/>
					</div>
				</div>
			)}

			{/* Universal Performance Banner */}
			{avgLoadTime > 0 && (
				<div className='flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5'>
					<div className='p-2 bg-primary/10 rounded-lg'>
						<Gauge className='h-6 w-6 text-primary' />
					</div>
					<div className='flex-1'>
						<div className='flex items-center gap-2'>
							<h3 className='text-sm font-bold text-foreground'>
								Universal Load Performance
							</h3>
							<Badge
								variant={avgLoadTime < 3000 ? 'default' : 'secondary'}
								className={
									avgLoadTime < 3000
										? 'bg-emerald-500 hover:bg-emerald-600'
										: ''
								}
							>
								{avgLoadTime < 3000
									? 'Excellent'
									: avgLoadTime < 5000
										? 'Good'
										: 'Needs Optimization'}
							</Badge>
						</div>
						<p className='text-xs text-muted-foreground mt-0.5'>
							The site takes an average of{' '}
							<span className='font-bold text-foreground'>{avgLoadTime}ms</span>{' '}
							to respond across all analyzed sessions.
						</p>
					</div>
					<div className='flex items-center gap-6 pr-2'>
						<div className='text-center'>
							<p className='text-[10px] font-bold uppercase text-muted-foreground'>
								Avg Desktop
							</p>
							<p className='text-lg font-bold'>{avgLoadTime}ms</p>
						</div>
						{pagesWithPerf > 0 &&
							auditedPages.some((r) => r.performanceMetrics?.mobile) && (
								<div className='text-center'>
									<p className='text-[10px] font-bold uppercase text-muted-foreground'>
										Avg Mobile
									</p>
									<p className='text-lg font-bold'>
										{Math.round(
											auditedPages.reduce(
												(sum, r) =>
													sum +
													(r.performanceMetrics?.mobile?.totalLoadTime || 0),
												0,
											) /
												(auditedPages.filter(
													(r) => r.performanceMetrics?.mobile,
												).length || 1),
										)}
										ms
									</p>
								</div>
							)}
					</div>
				</div>
			)}

			{/* Stats Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
				<Card className='rounded-xl border-border bg-card shadow-none'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							Pages
						</CardTitle>
						<BarChart3 className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className='text-2xl font-bold tracking-tight'>
							{results.length}
						</div>
						<p className='text-[11px] text-muted-foreground mt-1'>
							<span className='font-medium text-foreground'>
								{pagesWithMetaDesc}
							</span>{' '}
							with meta description (
							{results.length > 0
								? Math.round((pagesWithMetaDesc / results.length) * 100)
								: 0}
							%)
						</p>
					</CardContent>
				</Card>

				<Card className='rounded-xl border-border bg-card shadow-none'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							Schema & Assets
						</CardTitle>
						<FileText className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className='text-2xl font-bold tracking-tight'>
							{pagesWithSchema}/{results.length}
						</div>
						<p className='text-[11px] text-muted-foreground mt-1'>
							Breadcrumbs:{' '}
							<span className='font-medium text-foreground'>
								{pagesWithBreadcrumbs}
							</span>{' '}
							· Errors:{' '}
							<span className='font-medium text-foreground'>
								{pagesWithSchemaErrors}
							</span>
						</p>
						<p className='text-[11px] text-muted-foreground mt-1'>
							Inline heavy:{' '}
							<span className='font-medium text-foreground'>
								{pagesWithHeavyInline}
							</span>{' '}
							· Minified:{' '}
							<span className='font-medium text-foreground'>
								{pagesWithGoodMinification}
							</span>
						</p>
					</CardContent>
				</Card>

				<Card className='rounded-xl border-border bg-card shadow-none'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							URL & HTTPS
						</CardTitle>
						<Gauge className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className='text-2xl font-bold tracking-tight'>
							{pagesWithHttps}/{results.length}
						</div>
						<p className='text-[11px] text-muted-foreground mt-1'>
							Clean URLs:{' '}
							<span className='font-medium text-foreground'>
								{pagesWithCleanUrl}
							</span>
						</p>
					</CardContent>
				</Card>

				<Card className='rounded-xl border-border bg-card shadow-none'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							Social Preview
						</CardTitle>
						<Send className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className='text-2xl font-bold tracking-tight'>
							{pagesWithCompleteSocial}/{results.length}
						</div>
						<p className='text-[11px] text-muted-foreground mt-1'>
							OG:{' '}
							<span className='font-medium text-foreground'>
								{pagesWithCompleteOG}
							</span>{' '}
							· Twitter:{' '}
							<span className='font-medium text-foreground'>
								{pagesWithCompleteTwitter}
							</span>
						</p>
					</CardContent>
				</Card>

				<Card className='rounded-xl border-border bg-card shadow-none'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							Avg Word Count
						</CardTitle>
						<FileText className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className='text-2xl font-bold tracking-tight'>
							{avgWordCount.toLocaleString()}
						</div>
						<p className='text-[11px] text-muted-foreground mt-1'>
							Total:{' '}
							<span className='font-medium text-foreground'>
								{totalWords.toLocaleString()}
							</span>{' '}
							words
						</p>
					</CardContent>
				</Card>

				<Card className='rounded-xl border-border bg-card shadow-none'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							Images
						</CardTitle>
						<Image className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className='text-2xl font-bold tracking-tight'>
							{totalImages}
						</div>
						<p className='text-[11px] mt-1 flex items-center gap-1.5'>
							{totalImagesWithoutAlt > 0 ? (
								<>
									<AlertTriangle className='h-3 w-3 text-destructive' />
									<span className='text-destructive font-medium'>
										{totalImagesWithoutAlt} missing alt tags
									</span>
								</>
							) : (
								<>
									<CheckCircle className='h-3 w-3 text-emerald-500' />
									<span className='text-emerald-600 font-medium'>
										All have alt text
									</span>
								</>
							)}
						</p>
					</CardContent>
				</Card>

				<Card className='rounded-xl border-border bg-card shadow-none'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							Links
						</CardTitle>
						<LinkIcon className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className='text-2xl font-bold tracking-tight'>
							{totalLinks}
						</div>
						<p className='text-[11px] text-muted-foreground mt-1'>
							<span className='font-medium text-foreground'>
								{pagesWithH1}/{results.length}
							</span>{' '}
							with H1 (
							{results.length > 0
								? Math.round((pagesWithH1 / results.length) * 100)
								: 0}
							%)
						</p>
					</CardContent>
				</Card>

				{avgScore !== null && (
					<Card className='rounded-xl border-border bg-gradient-to-r from-primary/5 to-primary/10 shadow-none hover:shadow-sm transition-all duration-200'>
						<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
							<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
								Overall SEO Score
							</CardTitle>
							<BarChart3 className='h-4 w-4 text-primary/70' />
						</CardHeader>
						<CardContent className='px-4 pb-4'>
							<div className='flex items-center gap-3'>
								<div
									className={`text-2xl font-bold ${
										avgScore >= 80
											? 'text-emerald-600'
											: avgScore >= 60
												? 'text-yellow-600'
												: 'text-red-600'
									}`}
								>
									{avgScore}
								</div>
								<div className='flex flex-col'>
									<span className='text-[11px] font-medium'>
										Grade:{' '}
										{avgScore >= 90
											? 'A'
											: avgScore >= 80
												? 'B'
												: avgScore >= 70
													? 'C'
													: avgScore >= 60
														? 'D'
														: 'F'}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Details List */}
			{(() => {
				const totalDetailPages = Math.ceil(results.length / RESULTS_PER_PAGE);
				const startIdx = (currentPage - 1) * RESULTS_PER_PAGE;
				const pageResults = results.slice(
					startIdx,
					startIdx + RESULTS_PER_PAGE,
				);

				// Show pending URLs that haven't been completed yet
				const actualPending = pendingUrls.filter(
					(url) => !results.some((r) => r.url === url),
				);
				const showPending = currentPage === 1 && actualPending.length > 0;

				return (
					<div className='space-y-4 pt-2'>
						<div className='flex items-center justify-between gap-2'>
							<div className='flex items-center gap-2'>
								<h3 className='text-sm font-bold uppercase tracking-widest text-muted-foreground'>
									Detailed Breakdown
								</h3>
								<div className='h-px flex-1 bg-border' />
							</div>

							{totalDetailPages > 1 && (
								<span className='text-[11px] text-muted-foreground whitespace-nowrap'>
									{startIdx + 1}–
									{Math.min(startIdx + RESULTS_PER_PAGE, results.length)} of{' '}
									{results.length}
								</span>
							)}
						</div>

						<div className='grid gap-4'>
							{pageResults.map((page) => (
								<div
									key={page.url}
									className='group'
								>
									<PageAnalysisCard
										page={page}
										report={reports[page.url] || null}
										index={startIdx + results.indexOf(page)}
										onRescrape={onRescrape}
										isRescraping={rescrapingUrl === page.url}
									/>
								</div>
							))}

							{showPending &&
								actualPending.map((url) => (
									<div
										key={url}
										className='group opacity-60'
									>
										<Card className='rounded-xl border-dashed border-2 bg-muted/30'>
											<CardContent className='p-4 flex items-center justify-between'>
												<div className='flex items-center gap-3'>
													<div className='h-8 w-8 rounded-lg bg-muted flex items-center justify-center'>
														<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
													</div>
													<div>
														<p className='text-sm font-medium truncate max-w-[300px]'>
															{url}
														</p>
														<p className='text-[11px] text-muted-foreground'>
															Analyzing...
														</p>
													</div>
												</div>
												<Badge variant='outline'>Scraping</Badge>
											</CardContent>
										</Card>
									</div>
								))}
						</div>

						{/* Pagination Controls */}
						{totalDetailPages > 1 && (
							<div className='flex items-center justify-center gap-1.5 py-3'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setCurrentPage(1)}
									disabled={currentPage === 1}
									className='h-8 px-2.5 text-xs rounded-lg'
								>
									First
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className='h-8 w-8 p-0 rounded-lg'
								>
									<ChevronLeft className='h-4 w-4' />
								</Button>

								{Array.from(
									{ length: Math.min(5, totalDetailPages) },
									(_, i) => {
										let pageNum: number;
										if (totalDetailPages <= 5) {
											pageNum = i + 1;
										} else if (currentPage <= 3) {
											pageNum = i + 1;
										} else if (currentPage >= totalDetailPages - 2) {
											pageNum = totalDetailPages - 4 + i;
										} else {
											pageNum = currentPage - 2 + i;
										}
										return (
											<Button
												key={pageNum}
												variant={
													currentPage === pageNum ? 'default' : 'outline'
												}
												size='sm'
												onClick={() => setCurrentPage(pageNum)}
												className='h-8 w-8 p-0 rounded-lg text-xs font-semibold'
											>
												{pageNum}
											</Button>
										);
									},
								)}

								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										setCurrentPage((p) => Math.min(totalDetailPages, p + 1))
									}
									disabled={currentPage === totalDetailPages}
									className='h-8 w-8 p-0 rounded-lg'
								>
									<ChevronRight className='h-4 w-4' />
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setCurrentPage(totalDetailPages)}
									disabled={currentPage === totalDetailPages}
									className='h-8 px-2.5 text-xs rounded-lg'
								>
									Last
								</Button>
							</div>
						)}
					</div>
				);
			})()}

			{reportData && (
				<ShareViaWhatsApp
					isOpen={showWhatsAppDialog}
					onClose={() => {
						setShowWhatsAppDialog(false);
						setReportData(null);
					}}
					documentBase64={reportData.base64}
					fileName={reportData.fileName}
					totalPages={results.length}
				/>
			)}
		</div>
	);
}
