export interface PageHeadingMap {
	h1: string[];
	h2: string[];
	h3: string[];
	h4: string[];
	h5: string[];
	h6: string[];
}

export interface PageImage {
	src: string | null;
	alt: string | null;
}

export interface PerformanceMetrics {
	ttfb: number;
	dns: number;
	tcp: number;
	firstByte: number;
	contentDownload: number;
	totalLoadTime: number;
	pageSize: number;
	pageSizeFormatted: string;
	fcp: number | null;
	lcp: number | null;
	fid: number | null;
	cls: number | null;
	inp: number | null;
	fcpRating: 'good' | 'needs-improvement' | 'poor' | null;
	lcpRating: 'good' | 'needs-improvement' | 'poor' | null;
	fidRating: 'good' | 'needs-improvement' | 'poor' | null;
	clsRating: 'good' | 'needs-improvement' | 'poor' | null;
	inpRating: 'good' | 'needs-improvement' | 'poor' | null;
	overallPerformanceScore: number | null;
}

export interface SectionResult {
	score: number;
	maxScore: number;
	issues: Array<{
		message: string;
		severity: 'low' | 'medium' | 'high';
		fix: string;
	}>;
	metrics: Record<string, number>;
}

export interface SeoReport {
	totalScore: number;
	grade: 'A' | 'B' | 'C' | 'D' | 'F';
	sections: {
		meta: SectionResult;
		headings: SectionResult;
		images: SectionResult;
		content: SectionResult;
		links: SectionResult;
		technical: SectionResult;
		performance: SectionResult;
	};
}

export interface ScrapedPageData {
	url: string;
	redirectUrls: string[];
	redirectCount: number;
	analysisReport: SeoReport | null;
	isError: boolean;
	title: string;
	metaDescription: string | null;
	metaKeywords: string | null;
	canonical: string | null;
	robotsMeta: string | null;
	headings: {
		h1: string[];
		h2: string[];
		h3: string[];
		h4: string[];
		h5: string[];
		h6: string[];
	};
	images: {
		src: string;
		alt: string;
		size: number;
		type: string;
	}[];
	links: string[];
	socialLinks: string[];
	paragraphExcerpt: string[];
	textSample: string;
	emails: string[];
	phoneNumbers: string[];
	wordCount: number;
	internalLinkCount: number;
	externalLinkCount: number;
	performanceMetrics: PerformanceMetrics | null;
}

export interface CategorizedUrls {
	blog: string[];
	product: string[];
	category: string[];
	post: string[];
	pages: string[];
	other: string[];
}

export interface SitePageCountResult {
	requestedUrl: string;
	analyzedDomain: string;
	robotsTxt: string;
	sitemapUrls: string[];
	totalPages: number;
	categorizedUrls: CategorizedUrls;
	urls: string[];
}

export interface SiteScrapeResult {
	requestedUrl: string;
	analyzedDomain: string;
	robotsTxt: string;
	sitemapUrls: string[];
	categorizedUrls: CategorizedUrls;
	totalPagesDiscovered: number;
	pageDetails: ScrapedPageData[];
}

export interface AnalyzeResult {
	mode: 'page' | 'site';
	requestedUrl: string;
	normalizedUrl: string;
	data: ScrapedPageData | SiteScrapeResult;
}

export interface SeoApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
}

export type SeoAnalysisMode = 'auto' | 'page' | 'site';

export interface SitemapState {
	url: string;
	mode: SeoAnalysisMode;
	isLoading: boolean;
	sitemap: SitePageCountResult | null;
	error: string | null;
}

export interface AnalysisState {
	selectedUrls: string[];
	isAnalyzing: boolean;
	results: ScrapedPageData[];
	error: string | null;
}

export interface SeoAnalysisHistoryItem {
	_id: string;
	user: string;
	analysisType: 'single_page' | 'full_site' | 'partial_site';
	requestedUrl: string;
	analyzedUrls: string[];
	totalPagesAnalyzed: number;
	successfulPages: number;
	failedPages: number;
	isDeleted: boolean;
	deletedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface SeoAnalysisHistoryResponse {
	analyses: SeoAnalysisHistoryItem[];
	total: number;
	page: number;
	totalPages: number;
}
