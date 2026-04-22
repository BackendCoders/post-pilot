import { api } from './api';
import type { SitePageCountResult, ScrapedPageData, SiteScrapeResult, SeoAnalysisHistoryResponse } from '@/types/seo.types';

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

	getAnalysisHistory: async (params?: { page?: number; limit?: number; analysisType?: string; url?: string }) => {
		const response = await api.get<{ success: boolean; data: SeoAnalysisHistoryResponse }>('/api/seo/analysis/history', {
			params,
		});
		return response.data;
	},

	getAnalysisById: async (id: string, params?: { page?: number; limit?: number }) => {
		const response = await api.get<{ success: boolean; data: any }>(`/api/seo/analysis/${id}`, {
			params,
		});
		return response.data;
	},

	softDeleteAnalysis: async (id: string) => {
		const response = await api.delete<{ success: boolean; message: string }>(`/api/seo/analysis/${id}`);
		return response.data;
	},

	restoreAnalysis: async (id: string) => {
		const response = await api.post<{ success: boolean; message: string }>(`/api/seo/analysis/${id}/restore`);
		return response.data;
	},

	hardDeleteAnalysis: async (id: string) => {
		const response = await api.delete<{ success: boolean; message: string }>(`/api/seo/analysis/${id}/permanent`);
		return response.data;
	},

	getDeletedAnalyses: async (params?: { page?: number; limit?: number }) => {
		const response = await api.get<{ success: boolean; data: SeoAnalysisHistoryResponse }>('/api/seo/analysis/history/deleted', {
			params,
		});
		return response.data;
	},
};
