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

export interface ScrapedPageData {
	url: string;
	redirectUrls: string[];
	redirectCount: number;
	isError: boolean;
	title: string;
	metaDescription: string | null;
	metaKeywords: string | null;
	canonical: string | null;
	robotsMeta: string | null;
	headings: PageHeadingMap;
	images: PageImage[];
	links: string[];
	socialLinks: string[];
	paragraphExcerpt: string[];
	textSample: string;
	wordCount: number;
	internalLinkCount: number;
	externalLinkCount: number;
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
