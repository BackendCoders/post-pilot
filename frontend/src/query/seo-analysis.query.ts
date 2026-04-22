import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/service/api';
import type { ScrapedPageData, SeoReport } from '@/types/seo.types';

export type AnalysisType = 'single_page' | 'full_site' | 'partial_site';

export interface SaveAnalysisParams {
  requestedUrl: string;
  analysisType: AnalysisType;
  analyzedUrls: string[];
  results: ScrapedPageData[];
}

export interface PageAnalysisHistory {
  analysisId: string;
  analysisType: string;
  analyzedAt: string;
  analysisCount: number;
  lastAnalyzedAt: string;
  firstAnalyzedAt: string;
  isError: boolean;
}

export interface UserSeoStats {
  totalAnalyses: number;
  totalPagesAnalyzed: number;
  uniqueUrlsAnalyzed: number;
  singlePageAnalyses: number;
  fullSiteAnalyses: number;
  partialSiteAnalyses: number;
}

export interface AnalysisHistoryResponse {
  analyses: Record<string, unknown>[];
  total: number;
  page: number;
  totalPages: number;
}

export const useSaveAnalysis = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: SaveAnalysisParams) => {
      console.log('useSaveAnalysis called with:', params);
      const result = await api.post('/api/seo/analysis', params).then((res) => res.data);
      console.log('useSaveAnalysis result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('useSaveAnalysis onSuccess:', data);
      queryClient.invalidateQueries({ queryKey: ['seo-analysis'] });
    },
    onError: (error: unknown) => {
      console.error('useSaveAnalysis onError:', error);
      const axiosError = error as { response?: { data?: { error?: string } } };
      alert(`Failed to save analysis: ${axiosError?.response?.data?.error || 'Unknown error'}`);
    },
  });
};

export const useUpdatePageAnalysis = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pageUrl,
      analysisData,
    }: {
      pageUrl: string;
      analysisData: ScrapedPageData;
    }) =>
      api.post('/api/seo/analysis/page', {
        pageUrl,
        analysisData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-analysis'] });
    },
  });
};

export const useAnalysisHistory = (params?: {
  page?: number;
  limit?: number;
  analysisType?: AnalysisType;
  url?: string;
}) => {
  return useQuery<AnalysisHistoryResponse>({
    queryKey: ['seo-analysis', 'history', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.analysisType) searchParams.set('analysisType', params.analysisType);
      if (params?.url) searchParams.set('url', params.url);

      return api
        .get(`/api/seo/analysis/history?${searchParams.toString()}`)
        .then((res) => res.data.data);
    },
  });
};

export const usePageAnalysisHistory = (url: string) => {
  return useQuery<PageAnalysisHistory[]>({
    queryKey: ['seo-analysis', 'page-history', url],
    queryFn: () =>
      api
        .get(`/api/seo/analysis/history/page/${encodeURIComponent(url)}`)
        .then((res) => res.data.data),
    enabled: !!url,
  });
};

export const usePageAnalysisCount = (url: string) => {
  return useQuery<{ count: number }>({
    queryKey: ['seo-analysis', 'count', url],
    queryFn: () =>
      api
        .get(`/api/seo/analysis/count?url=${encodeURIComponent(url)}`)
        .then((res) => res.data.data),
    enabled: !!url,
  });
};

export const useUserSeoStats = () => {
  return useQuery<UserSeoStats>({
    queryKey: ['seo-analysis', 'stats'],
    queryFn: () =>
      api.get('/api/seo/analysis/stats').then((res) => res.data.data),
  });
};

export interface SavedAnalysis {
  _id: string;
  user: string;
  analysisType: AnalysisType;
  requestedUrl: string;
  analyzedUrls: string[];
  totalPagesAnalyzed: number;
  successfulPages: number;
  failedPages: number;
  results: Array<{
    url: string;
    analysisData: ScrapedPageData;
    analysisReport: SeoReport | null;
    analysisCount: number;
    firstAnalyzedAt: string;
    lastAnalyzedAt: string;
  }>;
  pagination?: {
    page: number;
    limit: number;
    totalResults: number;
    totalPages: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const useGetAnalysis = (
  analysisId: string | null,
  params?: { page?: number; limit?: number }
) => {
  return useQuery<SavedAnalysis>({
    queryKey: ['seo-analysis', 'detail', analysisId, params?.page, params?.limit],
    queryFn: () =>
      api
        .get(`/api/seo/analysis/${analysisId}`, { params })
        .then((res) => res.data.data),
    enabled: !!analysisId,
  });
};
