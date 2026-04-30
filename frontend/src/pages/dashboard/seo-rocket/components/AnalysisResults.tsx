import { useState } from 'react';
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
import type { ScrapedPageData, SeoReport } from '@/types/seo.types';

interface AnalysisResultsProps {
	results: ScrapedPageData[];
	reports?: Record<string, SeoReport>;
	onRescrape?: (url: string) => void;
	rescrapingUrl?: string | null;
}

const RESULTS_PER_PAGE = 20;

export default function AnalysisResults({
	results,
	reports = {},
	onRescrape,
	rescrapingUrl,
}: AnalysisResultsProps) {
	const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
	const [reportData, setReportData] = useState<{
		base64: string;
		fileName: string;
	} | null>(null);
	const [currentPage, setCurrentPage] = useState(1);

	const { data: whatsappStatus } = useWhatsAppStatus();
	const isWhatsAppConnected = whatsappStatus?.state === 'CONNECTED';

	const handleDownloadPdf = () => {
		generateSeoReport(results, reports);
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
	if (results.length === 0) return null;

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
	const avgWordCount = Math.round(totalWords / results.length);

	const avgScore = Object.keys(reports).length > 0
		? Math.round(
				Object.values(reports).reduce((sum, r) => sum + r.totalScore, 0) /
					Object.keys(reports).length
		  )
		: null;

	const pagesWithPerf = results.filter((p) => p.performanceMetrics).length;
	const avgLoadTime = pagesWithPerf > 0
		? Math.round(
			results
				.filter((p) => p.performanceMetrics)
				.reduce((sum, p) => sum + (p.performanceMetrics?.desktop.totalLoadTime || 0), 0) / pagesWithPerf
		  )
		: 0;
	const slowPages = results.filter((p) => p.performanceMetrics && p.performanceMetrics.desktop.totalLoadTime > 3000).length;

	return (
		<div
			data-walkthrough='seo-results'
			className='space-y-6 animate-in fade-in duration-500'
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

			{/* Stats Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
				<Card className='rounded-xl border-border bg-card shadow-none hover:shadow-sm transition-all duration-200'>
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
							{Math.round((pagesWithMetaDesc / results.length) * 100)}%)
						</p>
					</CardContent>
				</Card>

				<Card className='rounded-xl border-border bg-card shadow-none hover:shadow-sm transition-all duration-200'>
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

				<Card className='rounded-xl border-border bg-card shadow-none hover:shadow-sm transition-all duration-200'>
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

				<Card className='rounded-xl border-border bg-card shadow-none hover:shadow-sm transition-all duration-200'>
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
							with H1 ({Math.round((pagesWithH1 / results.length) * 100)}%)
						</p>
					</CardContent>
				</Card>

				<Card className='rounded-xl border-border bg-card shadow-none hover:shadow-sm transition-all duration-200'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							Avg Load Time
						</CardTitle>
						<Gauge className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className={`text-2xl font-bold tracking-tight ${
							avgLoadTime > 5000 ? 'text-red-600' :
							avgLoadTime > 3000 ? 'text-yellow-600' : 'text-emerald-600'
						}`}>
							{avgLoadTime > 0 ? `${avgLoadTime}ms` : '-'}
						</div>
						<p className='text-[11px] mt-1 flex items-center gap-1.5'>
							{slowPages > 0 ? (
								<>
									<AlertTriangle className='h-3 w-3 text-yellow-600' />
									<span className='text-yellow-600 font-medium'>
										{slowPages} slow page{slowPages > 1 ? 's' : ''}
									</span>
								</>
							) : avgLoadTime > 0 ? (
								<>
									<CheckCircle className='h-3 w-3 text-emerald-500' />
									<span className='text-emerald-600 font-medium'>
										All pages fast
									</span>
								</>
							) : (
								<span className='text-muted-foreground'>No data</span>
							)}
						</p>
					</CardContent>
				</Card>
			</div>

			{avgScore !== null && (
				<Card className="rounded-xl border-border bg-gradient-to-r from-primary/5 to-primary/10">
					<CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0">
						<CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
							Overall SEO Score
						</CardTitle>
						<BarChart3 className="h-4 w-4 text-primary/70" />
					</CardHeader>
					<CardContent className="px-4 pb-4">
						<div className="flex items-center gap-3">
							<div
								className={`text-3xl font-bold ${
									avgScore >= 80
										? 'text-emerald-600'
										: avgScore >= 60
											? 'text-yellow-600'
											: 'text-red-600'
								}`}
							>
								{avgScore}
							</div>
							<div className="flex flex-col">
								<span className="text-sm font-medium">
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
								<span className="text-[10px] text-muted-foreground">
									Based on {Object.keys(reports).length} pages
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Details List */}
			{(() => {
				const totalDetailPages = Math.ceil(results.length / RESULTS_PER_PAGE);
				const startIdx = (currentPage - 1) * RESULTS_PER_PAGE;
				const pageResults = results.slice(startIdx, startIdx + RESULTS_PER_PAGE);

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
									{startIdx + 1}–{Math.min(startIdx + RESULTS_PER_PAGE, results.length)} of {results.length}
								</span>
							)}
						</div>

						<div className='grid gap-4'>
							{pageResults.map((page, index) => (
								<div
									key={page.url}
									className='group transition-transform duration-200 active:scale-[0.99]'
								>
									<PageAnalysisCard
										page={page}
										report={reports[page.url] || null}
										index={startIdx + index}
										onRescrape={onRescrape}
										isRescraping={rescrapingUrl === page.url}
									/>
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

								{Array.from({ length: Math.min(5, totalDetailPages) }, (_, i) => {
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
											variant={currentPage === pageNum ? 'default' : 'outline'}
											size='sm'
											onClick={() => setCurrentPage(pageNum)}
											className='h-8 w-8 p-0 rounded-lg text-xs font-semibold'
										>
											{pageNum}
										</Button>
									);
								})}

								<Button
									variant='outline'
									size='sm'
									onClick={() => setCurrentPage((p) => Math.min(totalDetailPages, p + 1))}
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
