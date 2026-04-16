'use client';

import { useState, useCallback } from 'react';
import { Rocket, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import UrlInputForm from './components/UrlInputForm';
import SitemapView from './components/SitemapView';
import AnalysisResults from './components/AnalysisResults';
import { useSeoAnalysis, useRescrape } from '@/query/seo.query';
import type { SeoAnalysisMode, ScrapedPageData } from '@/types/seo.types';

export default function SEORocketPage() {
	const [view, setView] = useState<'input' | 'sitemap' | 'results'>('input');
	const [rescrapingUrl, setRescrapingUrl] = useState<string | null>(null);

	const {
		sitemap,
		selectedUrls,
		results,
		setResults,
		isFetchingSitemap,
		isAnalyzing,
		discoverSitemap,
		analyzeSelected,
		toggleUrl,
		selectAll,
		deselectAll,
		reset,
	} = useSeoAnalysis();

	const handleRescrapeComplete = useCallback((updatedPage: ScrapedPageData) => {
		setResults((prev: ScrapedPageData[]) =>
			prev.map((p: ScrapedPageData) => (p.url === updatedPage.url ? updatedPage : p)),
		);
		toast.success('Page rescraped successfully');
		setRescrapingUrl(null);
	}, [setResults]);

	const { mutate: rescrapeUrl } = useRescrape(handleRescrapeComplete);

	const handleRescrape = useCallback((url: string) => {
		setRescrapingUrl(url);
		rescrapeUrl(url);
	}, [rescrapeUrl]);

	const handleDiscover = (url: string, mode: SeoAnalysisMode) => {
		discoverSitemap(url, mode);
		setView('sitemap');
	};

	const handleAnalyze = () => {
		analyzeSelected();
		setView('results');
	};

	const handleReset = () => {
		reset();
		setView('input');
	};

	return (
		<div className='flex flex-col h-full bg-background font-sans text-foreground'>
			{/* Header: Compact with subtle border */}
			<header className='flex items-center justify-between px-5 py-3 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10'>
				<div className='flex items-center gap-2.5'>
					<div className='p-1.5 bg-primary/10 rounded-lg'>
						<Rocket className='h-5 w-5 text-primary' />
					</div>
					<h1 className='text-lg font-semibold tracking-tight'>SEO Rocket</h1>
				</div>

				{view !== 'input' && (
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
					{/* View Switcher Logic */}
					<div className='rounded-xl border border-border p-2 md:p-4 bg-card shadow-sm overflow-hidden transition-all duration-200'>
						{view === 'input' && (
							<div className='p-1'>
								<UrlInputForm
									onDiscover={handleDiscover}
									isLoading={isFetchingSitemap}
									hasSitemap={!!sitemap}
								/>
							</div>
						)}

						{view === 'sitemap' && sitemap && (
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

						{view === 'results' && results.length > 0 && (
							<AnalysisResults
								results={results}
								onRescrape={handleRescrape}
								rescrapingUrl={rescrapingUrl}
							/>
						)}

						{/* Empty State */}
						{view === 'results' && results.length === 0 && !isAnalyzing && (
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

					{/* Loading State Overlay/Footer */}
					{(isFetchingSitemap || isAnalyzing) && (
						<div className='flex items-center justify-center py-8 animate-in fade-in slide-in-from-bottom-2'>
							<div className='flex flex-col items-center gap-3'>
								<Loader2 className='h-6 w-6 text-primary animate-spin' />
								<p className='text-sm font-medium text-muted-foreground tracking-tight'>
									{isFetchingSitemap
										? 'Discovering sitemap...'
										: 'Analyzing pages...'}
								</p>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
