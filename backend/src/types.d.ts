export interface IPerformanceMetrics {
  desktop: {
    ttfb: number;
    dns: number;
    tcp: number;
    firstByte: number;
    contentDownload: number;
    totalLoadTime: number;
  };
  mobile: {
    ttfb: number;
    dns: number;
    tcp: number;
    firstByte: number;
    contentDownload: number;
    totalLoadTime: number;
  };
  pageSize: number;
  pageSizeFormatted: string;
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
  fcpRating: 'good' | 'needs-improvement' | 'poor' | null;
  lcpRating: 'good' | 'needs-improvement' | 'poor' | null;
  fidRating: 'good' | 'needs-improvement' | 'poor' | null;
  clsRating: 'good' | 'needs-improvement' | 'poor' | null;
  inpRating: 'good' | 'needs-improvement' | 'poor' | null;
  tbtRating: 'good' | 'needs-improvement' | 'poor' | null;
  overallPerformanceScore: number | null;
}

export interface ISectionResult {
  score: number;
  maxScore: number;
  issues: Array<{
    message: string;
    severity: 'low' | 'medium' | 'high';
    fix: string;
  }>;
  metrics: Record<string, number>;
  details?: any;
}

export interface ISeoReport {
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  sections: {
    meta: ISectionResult;
    headings: ISectionResult;
    images: ISectionResult;
    content: ISectionResult;
    links: ISectionResult;
    technical: ISectionResult;
    performance: ISectionResult;
  };
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
    isBroken?: boolean;
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
  performanceMetrics: IPerformanceMetrics | null;
  scripts: {
    src: string;
    size: number;
    isAsync: boolean;
    isDefer: boolean;
    isExternal: boolean;
  }[];
  stylesheets: {
    href: string;
    size: number;
    isExternal: boolean;
  }[];
}

