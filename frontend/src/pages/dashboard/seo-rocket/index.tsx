'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
	Rocket,
	RefreshCw,
	Loader2,
	AlertCircle,
	ArrowLeft,
} from 'lucide-react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import UrlInputForm from './components/UrlInputForm';
import SitemapView from './components/SitemapView';
import AnalysisResults from './components/AnalysisResults';
import Walkthrough from '@/components/Walkthrough';
import { useSeoAnalysis, useRescrape, useBulkScrape } from '@/query/seo.query';
import { useCompleteWalkthrough, useAuth } from '@/query/auth.query';
import {
	useSaveAnalysis,
	useUpdatePageAnalysis,
	useGetAnalysis,
} from '@/query/seo-analysis.query';
import { seoService } from '@/service/seo.service';
import { generateReportsFromScrapedData } from '@/utils/seo-report-generator';
import type {
	ScrapedPageData,
	SeoAnalysisMode,
	SeoReport,
} from '@/types/seo.types';

type ViewType = 'input' | 'sitemap' | 'results' | 'single';

export default function SEORocketPage() {
	const { data: user } = useAuth();
	const { mutate: completeWalkthrough } = useCompleteWalkthrough();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const [rescrapingUrl, setRescrapingUrl] = useState<string | null>(null);
	const [isScrapingSingle, setIsScrapingSingle] = useState(false);
	const [currentResults, setCurrentResults] = useState<ScrapedPageData[]>([]);
	const [currentReports, setCurrentReports] = useState<
		Record<string, SeoReport>
	>({});
	const [resultsPage, setResultsPage] = useState(1);
	const isScrapingSingleRef = useRef(false);
	const urlParamRef = useRef<string | null>(null);

	const currentView: ViewType = useMemo(() => {
		const pathname = location.pathname;
		if (pathname.includes('/single')) return 'single';
		if (pathname.includes('/sitemap')) return 'sitemap';
		if (pathname.includes('/results')) return 'results';
		return 'input';
	}, [location.pathname]);

	const urlParam = searchParams.get('url');
	const analysisIdParam = searchParams.get('id');

	const {
		sitemap,
		selectedUrls,
		setSelectedUrls,
		isFetchingSitemap,
		hasSitemapError,
		hasAnalysisError,
		discoverSitemap,
		toggleUrl,
		selectAll,
		deselectAll,
		reset,
	} = useSeoAnalysis();

	const { mutate: saveAnalysis } = useSaveAnalysis();
	const { mutate: updatePageAnalysis } = useUpdatePageAnalysis();
	const { data: savedAnalysis, isLoading: isLoadingAnalysis } = useGetAnalysis(
		currentView === 'results' ? analysisIdParam : null,
		{ page: resultsPage, limit: 20 },
	);

	const { mutateAsync: bulkScrape, isPending: isAnalyzing } = useBulkScrape();

	useEffect(() => {
		if (savedAnalysis && currentView === 'results') {
			const pageData: ScrapedPageData[] = savedAnalysis.results.map((r) => ({
				url: r.url,
				title: r.analysisData.title || '',
				metaDescription: r.analysisData.metaDescription,
				metaKeywords: r.analysisData.metaKeywords,
				canonical: r.analysisData.canonical,
				robotsMeta: r.analysisData.robotsMeta,
				headings: r.analysisData.headings,
				images: r.analysisData.images as any,
				links: r.analysisData.links,
				socialLinks: r.analysisData.socialLinks || [],
				paragraphExcerpt: r.analysisData.paragraphExcerpt,
				textSample: r.analysisData.textSample,
				wordCount: r.analysisData.wordCount,
				internalLinkCount: r.analysisData.internalLinkCount,
				externalLinkCount: r.analysisData.externalLinkCount,
				redirectUrls: r.analysisData.redirectUrls,
				redirectCount: r.analysisData.redirectCount,
				isError: r.analysisData.isError || false,
				emails: (r.analysisData as any).emails || [],
				phoneNumbers: (r.analysisData as any).phoneNumbers || [],
				performanceMetrics: r.analysisData.performanceMetrics as any,
				scripts: r.analysisData.scripts || [],
				stylesheets: r.analysisData.stylesheets || [],
				analysisReport: r.analysisReport as any,
			}));
			setCurrentResults(pageData);

			const reports: Record<string, SeoReport> = {};
			savedAnalysis.results.forEach((r) => {
				if (r.analysisReport) {
					reports[r.url] = r.analysisReport;
				}
			});
			setCurrentReports(reports);
		}
	}, [savedAnalysis, currentView]);

	useEffect(() => {
		if (currentResults.length > 0) {
			const generatedReports = generateReportsFromScrapedData(currentResults);
			setCurrentReports((prev) => {
				const merged = { ...prev };
				for (const [url, report] of Object.entries(generatedReports)) {
					if (!merged[url]) {
						merged[url] = report;
					}
				}
				return merged;
			});
		}
	}, [currentResults]);

	useEffect(() => {
		if (currentView === 'sitemap' && urlParam) {
			discoverSitemap(urlParam);
		}
	}, [currentView, urlParam]);

	useEffect(() => {
		if (currentView !== 'single' || !urlParam || isScrapingSingleRef.current) {
			return;
		}

		if (urlParamRef.current === urlParam && currentResults.length > 0) {
			return;
		}

		urlParamRef.current = urlParam;
		isScrapingSingleRef.current = true;
		setIsScrapingSingle(true);
		setCurrentResults([]);

		seoService
			.scrapeUrl(urlParam, 'page')
			.then((res) => {
				if (res.success && res.data) {
					const pageData = res.data as ScrapedPageData;
					setCurrentResults([pageData]);
					saveAnalysis(
						{
							requestedUrl: urlParam,
							analysisType: 'single_page',
							analyzedUrls: [urlParam],
							results: [pageData],
						},
						{
							onSuccess: (data) => {
								navigate(
									`/dashboard/seo-rocket/results?id=${data.data.analysisId}`,
								);
							},
						},
					);
				} else {
					toast.error(res.message || 'Failed to scrape page');
					setCurrentResults([]);
				}
			})
			.catch(() => {
				toast.error('Failed to scrape page');
				setCurrentResults([]);
			})
			.finally(() => {
				isScrapingSingleRef.current = false;
				setIsScrapingSingle(false);
			});
	}, [currentView, urlParam]);

	const handleAnalyze = useCallback(
		async (urls: string[]) => {
			const limitedUrls = urls.slice(0, 3);
			setSelectedUrls(limitedUrls);

			if (urls.length > 3) {
				toast.warning(
					'Only 3 webpages can be analyzed in free tier. First 3 pages selected.',
				);
			}

			try {
				const isFullSite =
					sitemap?.urls && limitedUrls.length === sitemap.urls.length;
				const requestedUrl = urlParam || limitedUrls[0] || '';

				// Trigger bulk scrape - server will now handle the saving directly
				const result = await bulkScrape({
					urls: limitedUrls,
					requestedUrl,
					isFullSite,
				});

				console.log('Bulk scrape result:', result);

				if (result.success) {
					setCurrentResults(result.data || []);

					// Navigation now uses the ID returned from the server's auto-save
					const analysisId = result.savedAnalysis?.analysisId;
					if (analysisId) {
						navigate(`/dashboard/seo-rocket/results?id=${analysisId}`);
					} else {
						// Fallback if save failed but scrape succeeded
						navigate('/dashboard/seo-rocket/results');
					}
				}
			} catch (error) {
				console.error('Analysis failed:', error);
				toast.error('Analysis failed');
			}
		},
		[urlParam, sitemap, bulkScrape, navigate, setSelectedUrls],
	);

	const handleRescrapeComplete = useCallback((updatedPage: ScrapedPageData) => {
		setCurrentResults((prev: ScrapedPageData[]) =>
			prev.map((p: ScrapedPageData) =>
				p.url === updatedPage.url ? updatedPage : p,
			),
		);
		updatePageAnalysis({
			pageUrl: updatedPage.url,
			analysisData: updatedPage,
		});
		toast.success('Page rescraped successfully');
		setRescrapingUrl(null);
	}, []);

	const { mutate: rescrapeUrl } = useRescrape(handleRescrapeComplete);

	const handleRescrape = useCallback(
		(url: string) => {
			setRescrapingUrl(url);
			rescrapeUrl(url);
		},
		[rescrapeUrl],
	);

	const handleDiscover = (url: string, mode: SeoAnalysisMode) => {
		if (mode === 'page') {
			navigate(`/dashboard/seo-rocket/single?url=${encodeURIComponent(url)}`);
		} else {
			navigate(`/dashboard/seo-rocket/sitemap?url=${encodeURIComponent(url)}`);
		}
	};

	const handleGoBackToInput = () => {
		reset();
		navigate('/dashboard/seo-rocket');
	};

	const handleGoBackToSitemap = () => {
		const url = searchParams.get('url');
		if (url) {
			navigate(`/dashboard/seo-rocket/sitemap?url=${encodeURIComponent(url)}`);
		} else {
			navigate('/dashboard/seo-rocket');
		}
	};

	const handleReset = () => {
		reset();
		setCurrentResults([]);
		setCurrentReports({});
		setResultsPage(1);
		navigate('/dashboard/seo-rocket');
	};

	return (
		<div className='flex flex-col h-full bg-background font-sans text-foreground'>
			<header className='flex items-center justify-between px-5 py-3 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
				<div className='flex items-center gap-2.5'>
					<div className='p-1.5 bg-primary/10 rounded-lg'>
						<Rocket className='h-5 w-5 text-primary' />
					</div>
					<h1 className='text-lg font-semibold tracking-tight'>SEO Rocket</h1>
				</div>

				{currentView !== 'input' && (
					<button
						onClick={handleReset}
						className='inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:shadow-sm active:scale-95 transition-all duration-200'
					>
						<RefreshCw className='h-3.5 w-3.5' />
						Start New Analysis
					</button>
				)}
			</header>

			<main className='flex-1 overflow-auto'>
				<div className='max-w-7xl mx-auto p-4 md:p-6 space-y-4'>
					<div className='rounded-xl border border-border p-2 md:p-4 bg-card shadow-sm overflow-hidden transition-all duration-200'>
						{currentView === 'input' && (
							<div className='p-1'>
								<UrlInputForm
									onDiscover={handleDiscover}
									isLoading={isFetchingSitemap}
								/>
							</div>
						)}

						{currentView === 'single' && !urlParam && (
							<div className='flex flex-col items-center justify-center py-16 px-4'>
								<div className='p-3 bg-muted rounded-full mb-4'>
									<Rocket className='h-6 w-6 text-muted-foreground' />
								</div>
								<p className='text-sm font-medium text-muted-foreground'>
									Enter a URL to analyze the page
								</p>
							</div>
						)}

						{currentView === 'single' && isScrapingSingle && (
							<div className='flex flex-col items-center justify-center py-16 px-4'>
								<div className='p-3 bg-primary/10 rounded-full mb-4'>
									<Loader2 className='h-6 w-6 text-primary animate-spin' />
								</div>
								<p className='text-sm font-medium text-muted-foreground'>
									Analyzing page...
								</p>
							</div>
						)}

						{currentView === 'single' &&
							!isScrapingSingle &&
							currentResults.length === 0 && (
								<div className='flex flex-col items-center justify-center py-16 px-4'>
									<div className='p-3 bg-destructive/10 rounded-full mb-4'>
										<AlertCircle className='h-6 w-6 text-destructive' />
									</div>
									<h3 className='text-base font-semibold mb-2'>
										Failed to Analyze Page
									</h3>
									<p className='text-sm text-muted-foreground text-center max-w-md mb-6'>
										We couldn't analyze the provided URL. Please check if the
										URL is valid and accessible.
									</p>
									<button
										onClick={handleGoBackToInput}
										className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
									>
										<ArrowLeft className='h-4 w-4' />
										Try Another URL
									</button>
								</div>
							)}

						{currentView === 'single' &&
							!isScrapingSingle &&
							currentResults.length > 0 && (
								<AnalysisResults
									results={currentResults}
									onRescrape={handleRescrape}
									rescrapingUrl={rescrapingUrl}
								/>
							)}

						{currentView === 'sitemap' && !urlParam && (
							<div className='flex flex-col items-center justify-center py-16 px-4'>
								<div className='p-3 bg-muted rounded-full mb-4'>
									<Rocket className='h-6 w-6 text-muted-foreground' />
								</div>
								<p className='text-sm font-medium text-muted-foreground'>
									Enter a URL to discover the sitemap
								</p>
							</div>
						)}

						{currentView === 'sitemap' &&
							hasSitemapError &&
							!isFetchingSitemap && (
								<div className='flex flex-col items-center justify-center py-16 px-4'>
									<div className='p-3 bg-destructive/10 rounded-full mb-4'>
										<AlertCircle className='h-6 w-6 text-destructive' />
									</div>
									<h3 className='text-base font-semibold mb-2'>
										Failed to Discover Sitemap
									</h3>
									<p className='text-sm text-muted-foreground text-center max-w-md mb-6'>
										We couldn't fetch the sitemap for the provided URL. This
										might be because the URL is invalid, the server is
										unreachable, or the URL doesn't have a valid sitemap.
									</p>
									<button
										onClick={handleGoBackToInput}
										className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
									>
										<ArrowLeft className='h-4 w-4' />
										Try Another URL
									</button>
								</div>
							)}

						{currentView === 'sitemap' && sitemap && (
							<SitemapView
								sitemap={sitemap}
								selectedUrls={selectedUrls}
								onToggleUrl={toggleUrl}
								onSelectAll={selectAll}
								onDeselectAll={deselectAll}
								onAnalyze={handleAnalyze}
								isAnalyzing={isAnalyzing}
							/>
						)}

						{currentView === 'results' && currentResults.length > 0 && (
							<AnalysisResults
								results={currentResults}
								reports={currentReports}
								onRescrape={handleRescrape}
								rescrapingUrl={rescrapingUrl}
							/>
						)}

						{currentView === 'results' && hasAnalysisError && !isAnalyzing && (
							<div className='flex flex-col items-center justify-center py-16 px-4'>
								<div className='p-3 bg-destructive/10 rounded-full mb-4'>
									<AlertCircle className='h-6 w-6 text-destructive' />
								</div>
								<h3 className='text-base font-semibold mb-2'>
									Analysis Failed
								</h3>
								<p className='text-sm text-muted-foreground text-center max-w-md mb-6'>
									We couldn't analyze the selected pages. This might be due to
									network issues, invalid URLs, or the pages being unavailable.
								</p>
								<button
									onClick={handleGoBackToSitemap}
									className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
								>
									<ArrowLeft className='h-4 w-4' />
									Go Back to Select Pages
								</button>
							</div>
						)}

						{currentView === 'results' &&
							currentResults.length === 0 &&
							!isAnalyzing &&
							!hasAnalysisError &&
							!isLoadingAnalysis && (
								<div className='flex flex-col items-center justify-center py-16 px-4'>
									<div className='p-3 bg-muted rounded-full mb-4'>
										<RefreshCw className='h-6 w-6 text-muted-foreground' />
									</div>
									<p className='text-sm font-medium text-muted-foreground'>
										No results to display. Please analyze pages first.
									</p>
								</div>
							)}
					</div>

					{(isFetchingSitemap ||
						isAnalyzing ||
						isScrapingSingle ||
						(currentView === 'results' && isLoadingAnalysis)) && (
						<div className='flex items-center justify-center py-8 animate-in fade-in slide-in-from-bottom-2'>
							<div className='flex flex-col items-center gap-3'>
								<Loader2 className='h-6 w-6 text-primary animate-spin' />
								<p className='text-sm font-medium text-muted-foreground tracking-tight'>
									{currentView === 'results' && isLoadingAnalysis
										? 'Loading analysis...'
										: isScrapingSingle
											? 'Analyzing page...'
											: isFetchingSitemap
												? 'Discovering sitemap...'
												: 'Analyzing pages...'}
								</p>
							</div>
						</div>
					)}
				</div>
			</main>

			<Walkthrough
				steps={[
					{
						title: 'Welcome to SEO Rocket!',
						content:
							'This tool helps you analyze and optimize your website for search engines. Let’s take a quick tour.',
					},
					{
						target: '[data-walkthrough="seo-url-input"]',
						title: 'Enter Website URL',
						content:
							'Start by entering the URL of the website you want to audit. You can choose to analyze a single page or the entire site.',
					},
					{
						target: '[data-walkthrough="seo-analyze-btn"]',
						title: 'Start Discovery',
						content:
							'Click "Discover" to fetch the sitemap and identify all available pages for analysis.',
					},
					{
						target: '[data-walkthrough="seo-history-link"]',
						title: 'Access History',
						content:
							'Your previous audits are saved here. You can revisit them anytime to track improvements.',
					},
				]}
				onComplete={() => completeWalkthrough('seo-rocket')}
				isVisible={!user?.completedWalkthroughs?.includes('seo-rocket')}
			/>
		</div>
	);
}
