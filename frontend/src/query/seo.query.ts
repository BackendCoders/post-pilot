import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { seoService } from '@/service/seo.service';
import type {
	SitePageCountResult,
	ScrapedPageData,
} from '@/types/seo.types';

export type AnalysisCallback = (data: { data: ScrapedPageData[]; scrapedCount: number }) => void;

const getErrorMessage = (err: unknown) => {
	if (isAxiosError(err)) {
		return (
			err.response?.data?.error || err.response?.data?.message || err.message
		);
	}
	if (err instanceof Error) return err.message;
	return 'Something went wrong';
};

export const useCountPages = () => {
	return useMutation({
		mutationFn: (url: string) => seoService.countPages(url),
		onError: (err) => {
			toast.error('Failed to fetch sitemap', {
				description: getErrorMessage(err),
			});
		},
	});
};

export const useBulkScrape = () => {
	return useMutation({
		mutationFn: async (params: { urls: string[]; requestedUrl?: string; isFullSite?: boolean }) => {
			console.log('useBulkScrape mutationFn called with:', params);
			const result = await seoService.bulkScrape(params);
			console.log('useBulkScrape got result:', result);
			return result;
		},
		onError: (err) => {
			console.error('useBulkScrape onError:', err);
			toast.error('Analysis failed', {
				description: getErrorMessage(err),
			});
		},
	});
};

export const useSeoJobStatus = (jobId: string | null) => {
	return useQuery({
		queryKey: ['seoJobStatus', jobId],
		queryFn: () => seoService.getJobStatus(jobId!),
		enabled: !!jobId,
		refetchInterval: (query) => {
			const status = query.state.data?.data?.status;
			return status === 'completed' || status === 'failed' ? false : 2000;
		},
	});
};

export const useRescrape = (
	onSuccess?: (data: ScrapedPageData) => void,
) => {
	return useMutation({
		mutationFn: (url: string) => seoService.rescrapeSingle(url),
		onSuccess: (data) => {
			if (data.success && data.mode === 'page' && data.data) {
				onSuccess?.(data.data as ScrapedPageData);
			}
		},
		onError: (err) => {
			toast.error('Rescrape failed', {
				description: getErrorMessage(err),
			});
		},
	});
};

export const useSeoAnalysis = () => {
	const [sitemap, setSitemap] = useState<SitePageCountResult | null>(null);
	const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
	const [results, setResults] = useState<ScrapedPageData[]>([]);
	const [hasSitemapError, setHasSitemapError] = useState(false);
	const [hasAnalysisError, setHasAnalysisError] = useState(false);
	const [activeJobId, setActiveJobId] = useState<string | null>(null);
	const [jobProgress, setJobProgress] = useState(0);
	const [jobStatus, setJobStatus] = useState<string | null>(null);
	const [lastAnalysisId, setLastAnalysisId] = useState<string | null>(null);

	const { mutateAsync: fetchSitemap, isPending: isFetchingSitemap } =
		useCountPages();
	const { mutateAsync: analyzeUrls, isPending: isRequestingScrape } = useBulkScrape();
	const { data: jobData } = useSeoJobStatus(activeJobId);

	useEffect(() => {
		if (jobData?.data) {
			setJobProgress(jobData.data.progress);
			setJobStatus(jobData.data.status);
			
			// Show partial results as they arrive
			if (jobData.data.results && jobData.data.results.length > 0) {
				setResults(jobData.data.results);
			}

			if (jobData.data.status === 'completed') {
				setResults(jobData.data.results || []);
				setLastAnalysisId(jobData.data.analysisId || null);
				setActiveJobId(null);
				toast.success(`Analysis completed!`);
			} else if (jobData.data.status === 'failed') {
				setHasAnalysisError(true);
				setActiveJobId(null);
				toast.error(`Analysis failed: ${jobData.data.error || 'Unknown error'}`);
			}
		}
	}, [jobData]);

	const discoverSitemap = useCallback(
		(url: string) => {
			setHasSitemapError(false);
			setSitemap(null);
			fetchSitemap(url, {
				onSuccess: (data) => {
					setSitemap(data);
					setSelectedUrls([]);
					setResults([]);
				},
				onError: () => {
					setHasSitemapError(true);
				},
			});
		},
		[fetchSitemap],
	);

	const analyzeSelected = useCallback(
		async (urls?: string[], requestedUrl?: string, isFullSite?: boolean) => {
			const urlsToAnalyze = urls || selectedUrls;
			if (urlsToAnalyze.length === 0) {
				toast.error('Please select at least one page to analyze');
				return;
			}

			setHasAnalysisError(false);
			setResults([]);
			setJobProgress(0);
			setJobStatus('pending');
			setLastAnalysisId(null);

			try {
				const response = await analyzeUrls({ 
					urls: urlsToAnalyze,
					requestedUrl,
					isFullSite
				});
				if (response.success && response.jobId) {
					setActiveJobId(response.jobId);
					toast.info('Analysis started...');
				} else {
					setHasAnalysisError(true);
				}
			} catch {
				setHasAnalysisError(true);
			}
		},
		[selectedUrls, analyzeUrls],
	);

	const toggleUrl = useCallback((url: string) => {
		setSelectedUrls((prev) => {
			if (prev.includes(url)) return prev.filter((u) => u !== url);
			if (prev.length >= 3) {
				toast.warning('Maximum 3 pages can be analyzed at once in the free tier.');
				return prev;
			}
			return [...prev, url];
		});
	}, []);

	const selectAll = useCallback(() => {
		if (sitemap) {
			const limitedUrls = sitemap.urls.slice(0, 3);
			setSelectedUrls(limitedUrls);
			if (sitemap.urls.length > 3) {
				toast.warning('Only 3 webpages can be analyzed at once. First 3 pages selected.');
			}
		}
	}, [sitemap]);

	const deselectAll = useCallback(() => {
		setSelectedUrls([]);
	}, []);

	const selectByCategory = useCallback(
		(category: string) => {
			if (sitemap) {
				const urls = sitemap.categorizedUrls[category];
				setSelectedUrls((prev) => {
					const otherSelected = prev.filter((u) => !urls.includes(u));
					const next = [...otherSelected, ...urls].slice(0, 3);
					if (otherSelected.length + urls.length > 3) {
						toast.warning('Selection limited to 3 pages.');
					}
					return next;
				});
			}
		},
		[sitemap],
	);

	const reset = useCallback(() => {
		setSitemap(null);
		setSelectedUrls([]);
		setResults([]);
		setHasSitemapError(false);
		setHasAnalysisError(false);
		setLastAnalysisId(null);
		setActiveJobId(null);
		setJobProgress(0);
		setJobStatus('idle');
	}, []);

	return {
		sitemap,
		selectedUrls,
		setSelectedUrls,
		results,
		setResults,
		isFetchingSitemap,
		isAnalyzing: isRequestingScrape || (!!activeJobId && jobStatus !== 'completed' && jobStatus !== 'failed'),
		jobProgress,
		jobStatus,
		activeJobId,
		lastAnalysisId,
		hasSitemapError,
		hasAnalysisError,
		discoverSitemap,
		analyzeSelected,
		toggleUrl,
		selectAll,
		deselectAll,
		selectByCategory,
		reset,
	};
};
