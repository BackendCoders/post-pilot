import mongoose, { Schema } from 'mongoose';

const linkSchema = new Schema(
  {
    url: { type: String, trim: true },
    anchorText: { type: String, default: null },
    rel: [{ type: String, trim: true }],
    isInternal: { type: Boolean, default: null },
    isBroken: { type: Boolean, default: false },
    statusCode: { type: Number, default: null },
  },
  { _id: false }
);

const imageSchema = new Schema(
  {
    src: { type: String, trim: true },
    alt: { type: String, default: null },
    title: { type: String, default: null },
    hasAlt: { type: Boolean, default: null },
  },
  { _id: false }
);

const headingsSchema = new Schema(
  {
    h1: [{ type: String, trim: true }],
    h2: [{ type: String, trim: true }],
    h3: [{ type: String, trim: true }],
    h4: [{ type: String, trim: true }],
    h5: [{ type: String, trim: true }],
    h6: [{ type: String, trim: true }],
  },
  { _id: false }
);

const summarySchema = new Schema(
  {
    total: { type: Number, default: 0 },
    passed: { type: Number, default: 0 },
    warning: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  { _id: false }
);

const issueSchema = new Schema(
  {
    code: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['content', 'technical', 'metadata', 'links', 'images', 'indexing'],
      default: 'technical',
    },
    status: {
      type: String,
      enum: ['open', 'fixed', 'ignored'],
      default: 'open',
    },
    recommendation: { type: String, default: null },
    affectedField: { type: String, default: null },
  },
  { _id: false }
);

const contentMetricsSchema = new Schema(
  {
    wordCount: { type: Number, default: 0 },
    paragraphCount: { type: Number, default: 0 },
    titleLength: { type: Number, default: 0 },
    metaDescriptionLength: { type: Number, default: 0 },
    headingScore: { type: Number, min: 0, max: 100, default: 0 },
    readabilityScore: { type: Number, min: 0, max: 100, default: 0 },
    keywordCoverageScore: { type: Number, min: 0, max: 100, default: 0 },
    contentDepthScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const technicalMetricsSchema = new Schema(
  {
    statusCode: { type: Number, default: null },
    responseTimeMs: { type: Number, default: null },
    internalLinkCount: { type: Number, default: 0 },
    externalLinkCount: { type: Number, default: 0 },
    brokenLinksCount: { type: Number, default: 0 },
    imageCount: { type: Number, default: 0 },
    imagesMissingAltCount: { type: Number, default: 0 },
    duplicateH1Count: { type: Number, default: 0 },
    hasMultipleH1: { type: Boolean, default: false },
    hasViewport: { type: Boolean, default: false },
    hasFavicon: { type: Boolean, default: false },
  },
  { _id: false }
);

const scoreBreakdownSchema = new Schema(
  {
    contentScore: { type: Number, min: 0, max: 100, default: 0 },
    metadataScore: { type: Number, min: 0, max: 100, default: 0 },
    technicalScore: { type: Number, min: 0, max: 100, default: 0 },
    linksScore: { type: Number, min: 0, max: 100, default: 0 },
    mediaScore: { type: Number, min: 0, max: 100, default: 0 },
    indexabilityScore: { type: Number, min: 0, max: 100, default: 0 },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const scoreHistorySchema = new Schema(
  {
    checkedAt: { type: Date, default: Date.now },
    overallScore: { type: Number, min: 0, max: 100, required: true },
    contentScore: { type: Number, min: 0, max: 100, default: 0 },
    technicalScore: { type: Number, min: 0, max: 100, default: 0 },
    metadataScore: { type: Number, min: 0, max: 100, default: 0 },
    issueCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const metricsSchema = new Schema(
  {
    content: { type: contentMetricsSchema, default: () => ({}) },
    technical: { type: technicalMetricsSchema, default: () => ({}) },
    scoreBreakdown: { type: scoreBreakdownSchema, default: () => ({}) },
    scoreHistory: { type: [scoreHistorySchema], default: [] },
    previousOverallScore: { type: Number, min: 0, max: 100, default: 0 },
    scoreDelta: { type: Number, default: 0 },
  },
  { _id: false }
);

const pageSummarySchema = new Schema(
  {
    totalIssues: { type: Number, default: 0 },
    openIssues: { type: Number, default: 0 },
    fixedIssues: { type: Number, default: 0 },
    criticalIssues: { type: Number, default: 0 },
    highIssues: { type: Number, default: 0 },
    mediumIssues: { type: Number, default: 0 },
    lowIssues: { type: Number, default: 0 },
  },
  { _id: false }
);

const sitewideInsightSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    impactedPages: [{ type: String, trim: true }],
  },
  { _id: false }
);

const pageAnalysisSchema = new Schema(
  {
    requestedUrl: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    normalizedUrl: { type: String, required: true, trim: true, index: true },
    finalUrl: { type: String, default: null, trim: true },
    domain: { type: String, default: null, trim: true, index: true },
    hostname: { type: String, default: null, trim: true },
    path: { type: String, default: null, trim: true },
    protocol: { type: String, default: null, trim: true },
    language: { type: String, default: null, trim: true },
    contentType: { type: String, default: null, trim: true },
    statusCode: { type: Number, default: null },
    crawlStatus: {
      type: String,
      enum: ['pending', 'success', 'failed', 'skipped'],
      default: 'pending',
      index: true,
    },
    crawlError: { type: String, default: null },
    redirectChain: [{ type: String, trim: true }],
    mode: {
      type: String,
      enum: ['page', 'site'],
      default: 'page',
      index: true,
    },

    title: { type: String, default: null },
    metaDescription: { type: String, default: null },
    metaKeywords: { type: String, default: null },
    canonical: { type: String, default: null },
    canonicalStatus: {
      type: String,
      enum: ['self', 'different', 'missing', 'invalid', 'unknown'],
      default: 'unknown',
    },
    robotsMeta: { type: String, default: null },
    indexability: {
      type: String,
      enum: ['indexable', 'non-indexable', 'blocked', 'unknown'],
      default: 'unknown',
      index: true,
    },

    headings: { type: headingsSchema, default: () => ({}) },
    hasViewport: { type: Boolean, default: false },
    hasFavicon: { type: Boolean, default: false },
    duplicateH1Count: { type: Number, default: 0 },
    hasMultipleH1: { type: Boolean, default: false },

    images: { type: [imageSchema], default: [] },
    imageCount: { type: Number, default: 0 },
    imagesMissingAltCount: { type: Number, default: 0 },

    links: { type: [linkSchema], default: [] },
    socialLinks: [{ type: String, trim: true }],
    brokenLinksCount: { type: Number, default: 0 },

    paragraphExcerpt: [{ type: String, trim: true }],
    textSample: { type: String, default: null },

    wordCount: { type: Number, default: 0 },
    internalLinkCount: { type: Number, default: 0 },
    externalLinkCount: { type: Number, default: 0 },

    metrics: { type: metricsSchema, default: () => ({}) },

    issues: { type: [issueSchema], default: [] },
    summary: { type: pageSummarySchema, default: () => ({}) },
    lastCheckedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const auditSummarySchema = new Schema(
  {
    totalPages: { type: Number, default: 0 },
    crawledPages: { type: Number, default: 0 },
    successPages: { type: Number, default: 0 },
    failedPages: { type: Number, default: 0 },
    averagePageScore: { type: Number, min: 0, max: 100, default: 0 },
    overallSeoScore: { type: Number, min: 0, max: 100, default: 0 },
    scoreImprovement: { type: Number, default: 0 },
    issueSummary: { type: summarySchema, default: () => ({}) },
  },
  { _id: false }
);

const auditSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedUrl: { type: String, required: true, trim: true },
    mode: {
      type: String,
      enum: ['page', 'site'],
      default: 'page',
      index: true,
    },
    auditStatus: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    auditVersion: { type: Number, default: 1 },
    numPages: { type: Number, default: 0 },
    analysis: { type: [pageAnalysisSchema], default: [] },
    summary: { type: auditSummarySchema, default: () => ({}) },
    issues: { type: [issueSchema], default: [] },
    sitewideInsights: { type: [sitewideInsightSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

auditSchema.index({ user: 1, requestedUrl: 1, createdAt: -1 });
auditSchema.index({ user: 1, auditStatus: 1, createdAt: -1 });

export default mongoose.model('PageAudit', auditSchema);
