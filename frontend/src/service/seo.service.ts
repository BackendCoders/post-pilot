import { api } from './api';
import type { SitePageCountResult, ScrapedPageData, SiteScrapeResult } from '@/types/seo.types';

export const seoService = {
	countPages: async (url: string) => {
		const response = await api.post<SitePageCountResult>('/api/seo/count-pages', { url });
		return response.data;
	},

	scrapeUrl: async (url: string, mode?: 'auto' | 'page' | 'site', fullSite?: boolean) => {
		const response = await api.post<{
			success: boolean;
			mode: 'page' | 'site';
			requestedUrl: string;
			normalizedUrl: string;
			data: ScrapedPageData | SiteScrapeResult;
			message: string;
		}>('/api/seo/scrape', {
			url,
			mode,
			fullSite,
		});
		return response.data;
	},

	bulkScrape: async (urls: string[]) => {
		const response = await api.post<{
			success: boolean;
			requestedCount: number;
			scrapedCount: number;
			failedCount: number;
			data: ScrapedPageData[];
			message: string;
		}>('/api/seo/bulk-scrape', { urls });
		return response.data;
	},

	rescrapeSingle: async (url: string) => {
		const response = await api.post<{
			success: boolean;
			requestedCount: number;
			scrapedCount: number;
			failedCount: number;
			data: ScrapedPageData[];
			message: string;
		}>('/api/seo/bulk-scrape', { urls: [url] });
		return response.data;
	},
};
