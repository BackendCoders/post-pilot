import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
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

export const useRescrape = (
	onSuccess?: (data: ScrapedPageData) => void,
) => {
	return useMutation({
		mutationFn: (url: string) => seoService.rescrapeSingle(url),
		onSuccess: (data) => {
			if (data.data && data.data.length > 0) {
				onSuccess?.(data.data[0]);
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

	const { mutateAsync: fetchSitemap, isPending: isFetchingSitemap } =
		useCountPages();
	const { mutateAsync: analyzeUrls, isPending: isAnalyzing } = useBulkScrape();

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
		async (urls?: string[], onSuccess?: AnalysisCallback) => {
			const urlsToAnalyze = urls || selectedUrls;
			if (urlsToAnalyze.length === 0) {
				toast.error('Please select at least one page to analyze');
				return;
			}

			console.log('analyzeSelected called with:', urlsToAnalyze);
			setHasAnalysisError(false);
			setResults([]);

			try {
				const data = await analyzeUrls({ urls: urlsToAnalyze });
				console.log('analyzeUrls success, data:', data);
				setResults(data.data || []);
				toast.success(`Analyzed ${data.scrapedCount} page(s)`);
				console.log('Calling onSuccess callback...');
				onSuccess?.(data);
				console.log('onSuccess callback called');
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
	}, []);

	return {
		sitemap,
		selectedUrls,
		setSelectedUrls,
		results,
		setResults,
		isFetchingSitemap,
		isAnalyzing,
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
