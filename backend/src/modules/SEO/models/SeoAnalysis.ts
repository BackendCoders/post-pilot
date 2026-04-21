import mongoose, { Schema } from 'mongoose';

export interface ISeoAnalysis {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  analysisType: 'single_page' | 'full_site' | 'partial_site';
  requestedUrl: string;
  analyzedUrls: string[];
  totalPagesAnalyzed: number;
  successfulPages: number;
  failedPages: number;
  results: IPageResult[];
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface IPageResult {
  url: string;
  analysisData: IPageAnalysisData;
  analysisReport: ISeoReport | null;
  analysisCount: number;
  firstAnalyzedAt: Date;
  lastAnalyzedAt: Date;
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

export interface ISectionResult {
  score: number;
  maxScore: number;
  issues: Array<{
    message: string;
    severity: 'low' | 'medium' | 'high';
    fix: string;
  }>;
  metrics: Record<string, number>;
}

export interface IPageAnalysisData {
  title: string | null;
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
  images: Array<{
    src: string | null;
    alt: string | null;
    size: number;
    type: string;
  }>;
  wordCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
  links: string[];
  socialLinks: string[];
  redirectUrls: string[];
  redirectCount: number;
  textSample: string;
  paragraphExcerpt: string[];
  isError: boolean;
  performanceMetrics: IPerformanceMetrics | null;
}

export interface IPerformanceMetrics {
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

const performanceMetricsSchema = new Schema(
  {
    ttfb: { type: Number, default: 0 },
    dns: { type: Number, default: 0 },
    tcp: { type: Number, default: 0 },
    firstByte: { type: Number, default: 0 },
    contentDownload: { type: Number, default: 0 },
    totalLoadTime: { type: Number, default: 0 },
    pageSize: { type: Number, default: 0 },
    pageSizeFormatted: { type: String, default: '0 Bytes' },
    fcp: { type: Number, default: null },
    lcp: { type: Number, default: null },
    fid: { type: Number, default: null },
    cls: { type: Number, default: null },
    inp: { type: Number, default: null },
    fcpRating: { type: String, enum: ['good', 'needs-improvement', 'poor', null], default: null },
    lcpRating: { type: String, enum: ['good', 'needs-improvement', 'poor', null], default: null },
    fidRating: { type: String, enum: ['good', 'needs-improvement', 'poor', null], default: null },
    clsRating: { type: String, enum: ['good', 'needs-improvement', 'poor', null], default: null },
    inpRating: { type: String, enum: ['good', 'needs-improvement', 'poor', null], default: null },
    overallPerformanceScore: { type: Number, default: null },
  },
  { _id: false }
);

const pageAnalysisDataSchema = new Schema<IPageAnalysisData>(
  {
    title: { type: String, default: null },
    metaDescription: { type: String, default: null },
    metaKeywords: { type: String, default: null },
    canonical: { type: String, default: null },
    robotsMeta: { type: String, default: null },
    headings: {
      h1: [{ type: String }],
      h2: [{ type: String }],
      h3: [{ type: String }],
      h4: [{ type: String }],
      h5: [{ type: String }],
      h6: [{ type: String }],
    },
    images: [
      {
        src: { type: String, default: null },
        alt: { type: String, default: null },
        size: { type: Number, default: null },
        type: { type: String, default: null },
      },
    ],
    wordCount: { type: Number, default: 0 },
    internalLinkCount: { type: Number, default: 0 },
    externalLinkCount: { type: Number, default: 0 },
    links: [{ type: String }],
    socialLinks: [{ type: String }],
    redirectUrls: [{ type: String }],
    redirectCount: { type: Number, default: 0 },
    textSample: { type: String, default: '' },
    paragraphExcerpt: [{ type: String }],
    isError: { type: Boolean, default: false },
    performanceMetrics: { type: performanceMetricsSchema, default: null },
  },
  { _id: false }
);

const issueSchema = new Schema(
  {
    message: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    fix: { type: String, required: true },
  },
  { _id: false }
);

const sectionResultSchema = new Schema(
  {
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    issues: { type: [issueSchema], default: [] },
    metrics: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const seoReportSectionsSchema = new Schema(
  {
    meta: { type: sectionResultSchema, default: () => ({}) },
    headings: { type: sectionResultSchema, default: () => ({}) },
    images: { type: sectionResultSchema, default: () => ({}) },
    content: { type: sectionResultSchema, default: () => ({}) },
    links: { type: sectionResultSchema, default: () => ({}) },
    technical: { type: sectionResultSchema, default: () => ({}) },
    performance: { type: sectionResultSchema, default: () => ({}) },
  },
  { _id: false }
);

const seoReportSchema = new Schema(
  {
    totalScore: { type: Number, required: true },
    grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], required: true },
    sections: { type: seoReportSectionsSchema, default: () => ({}) },
  },
  { _id: false }
);

const pageResultSchema = new Schema<IPageResult>({
  url: { type: String, required: true, index: true },
  analysisData: { type: pageAnalysisDataSchema, default: {} },
  analysisReport: { type: seoReportSchema, default: null },
  analysisCount: { type: Number, default: 1 },
  firstAnalyzedAt: { type: Date, default: Date.now },
  lastAnalyzedAt: { type: Date, default: Date.now },
});

const seoAnalysisSchema = new Schema<ISeoAnalysis>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    analysisType: {
      type: String,
      enum: ['single_page', 'full_site', 'partial_site'],
      required: true,
      index: true,
    },
    requestedUrl: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    analyzedUrls: [
      {
        type: String,
        trim: true,
      },
    ],
    totalPagesAnalyzed: {
      type: Number,
      default: 0,
    },
    successfulPages: {
      type: Number,
      default: 0,
    },
    failedPages: {
      type: Number,
      default: 0,
    },
    results: {
      type: [pageResultSchema],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

seoAnalysisSchema.index({ user: 1, createdAt: -1 });
seoAnalysisSchema.index({ user: 1, requestedUrl: 1 });
seoAnalysisSchema.index({ user: 1, analysisType: 1, createdAt: -1 });

export const SeoAnalysis = mongoose.model<ISeoAnalysis>(
  'SeoAnalysis',
  seoAnalysisSchema
);

export default SeoAnalysis;
