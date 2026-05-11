import { SeoAnalysis } from '../models/SeoAnalysis';
import { SeoJob } from '../models/SeoJob';
import mongoose from 'mongoose';
import { ScrapedPageData } from '../../../types';
import { generateSeoReport } from './seoReportGenerator';
import { scrapeWebPage, createErrorPageData } from '../scrapper';

export type AnalysisType = 'single_page' | 'full_site' | 'partial_site';

// interface ScrapedPageData {
//   url: string;
//   redirectUrls: string[];
//   redirectCount: number;
//   isError: boolean;
//   title: string;
//   metaDescription: string | null;
//   metaKeywords: string | null;
//   canonical: string | null;
//   robotsMeta: string | null;
//   headings: {
//     h1: string[];
//     h2: string[];
//     h3: string[];
//     h4: string[];
//     h5: string[];
//     h6: string[];
//   };
//   images: Array<{
//     src: string | null;
//     alt: string | null;
//     size: number;
//     type: string;
//   }>;
//   links: string[];
//   socialLinks: string[];
//   paragraphExcerpt: string[];
//   textSample: string;
//   wordCount: number;
//   internalLinkCount: number;
//   externalLinkCount: number;
// }

interface SaveAnalysisParams {
  userId: string;
  requestedUrl: string;
  analysisType: AnalysisType;
  analyzedUrls: string[];
  results: ScrapedPageData[];
}

interface PageHistoryResult {
  url: string;
  analysisCount: number;
  lastAnalyzedAt: Date;
}

export const seoAnalysisService = {
  async saveAnalysis({
    userId,
    requestedUrl,
    analysisType,
    analyzedUrls,
    results,
  }: SaveAnalysisParams): Promise<{
    analysisId: string;
    pageHistory: PageHistoryResult[];
  }> {
    const pageResults = results.map((page) => {
      let analysisReport = null;
      try {
        analysisReport = generateSeoReport(page);
      } catch (e) {
        console.warn(`Failed to generate report for ${page.url}:`, e);
      }
      return {
        url: page.url,
        analysisData: {
          title: page.title || null,
          metaDescription: page.metaDescription || null,
          metaKeywords: page.metaKeywords || null,
          canonical: page.canonical || null,
          robotsMeta: page.robotsMeta || null,
          headings: page.headings || { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
          images: (page.images || []).map((img) => ({
            src: img.src,
            alt: img.alt,
            size: img.size,
            type: img.type,
          })),
          wordCount: page.wordCount || 0,
          internalLinkCount: page.internalLinkCount || 0,
          externalLinkCount: page.externalLinkCount || 0,
          links: page.links || [],
          socialLinks: page.socialLinks || [],
          redirectUrls: page.redirectUrls || [],
          redirectCount: page.redirectCount || 0,
          textSample: page.textSample || '',
          paragraphExcerpt: page.paragraphExcerpt || [],
          isError: page.isError || false,
          performanceMetrics: page.performanceMetrics,
          scripts: (page.scripts || []).map(s => ({
            src: s.src,
            size: s.size,
            isAsync: s.isAsync,
            isDefer: s.isDefer,
            isExternal: s.isExternal
          })),
          stylesheets: (page.stylesheets || []).map(s => ({
            href: s.href,
            size: s.size,
            isExternal: s.isExternal
          }))
        },
        analysisReport,
        analysisCount: 1,
        firstAnalyzedAt: new Date(),
        lastAnalyzedAt: new Date(),
      };
    });

    const successfulPages = results.filter((p) => !p.isError).length;
    const failedPages = results.filter((p) => p.isError).length;

    const analysis = new SeoAnalysis({
      user: new mongoose.Types.ObjectId(userId),
      requestedUrl,
      analysisType,
      analyzedUrls,
      totalPagesAnalyzed: results.length,
      successfulPages,
      failedPages,
      results: pageResults,
    });

    await analysis.save();

    const pageHistory: PageHistoryResult[] = pageResults.map((p) => ({
      url: p.url,
      analysisCount: p.analysisCount,
      lastAnalyzedAt: p.lastAnalyzedAt,
    }));

    return {
      analysisId: analysis._id.toString(),
      pageHistory,
    };
  },

  async updateOrCreatePageAnalysis(
    userId: string,
    pageUrl: string,
    analysisData: ScrapedPageData
  ): Promise<{ pageResult: Record<string, unknown>; isNew: boolean }> {
    const normalizedUrl = normalizeUrl(pageUrl);

    const existingAnalysis = await SeoAnalysis.findOne({
      user: new mongoose.Types.ObjectId(userId),
      'results.url': normalizedUrl,
    }).sort({ createdAt: -1 });

    if (existingAnalysis) {
      const pageResult = existingAnalysis.results.find(
        (r) => normalizeUrl(r.url) === normalizedUrl
      );

      if (pageResult) {
        pageResult.analysisData = {
          title: analysisData.title || null,
          metaDescription: analysisData.metaDescription || null,
          metaKeywords: analysisData.metaKeywords || null,
          canonical: analysisData.canonical || null,
          robotsMeta: analysisData.robotsMeta || null,
          headings: analysisData.headings || { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
          images: (analysisData.images || []).map((img) => ({
            src: img.src,
            alt: img.alt,
            size: img.size,
            type: img.type,
          })),
          wordCount: analysisData.wordCount || 0,
          internalLinkCount: analysisData.internalLinkCount || 0,
          externalLinkCount: analysisData.externalLinkCount || 0,
          links: analysisData.links || [],
          socialLinks: analysisData.socialLinks || [],
          redirectUrls: analysisData.redirectUrls || [],
          redirectCount: analysisData.redirectCount || 0,
          textSample: analysisData.textSample || '',
          paragraphExcerpt: analysisData.paragraphExcerpt || [],
          isError: analysisData.isError || false,
          performanceMetrics: analysisData.performanceMetrics,
          scripts: (analysisData.scripts || []).map(s => ({
            src: s.src,
            size: s.size,
            isAsync: s.isAsync,
            isDefer: s.isDefer,
            isExternal: s.isExternal
          })),
          stylesheets: (analysisData.stylesheets || []).map(s => ({
            href: s.href,
            size: s.size,
            isExternal: s.isExternal
          }))
        };
        try {
          pageResult.analysisReport = generateSeoReport(analysisData);
        } catch (e) {
          console.warn(`Failed to generate report for ${analysisData.url}:`, e);
        }
        pageResult.analysisCount += 1;
        pageResult.lastAnalyzedAt = new Date();

        await existingAnalysis.save();

        return {
          pageResult: pageResult as unknown as Record<string, unknown>,
          isNew: false,
        };
      }
    }

    let singleReport = null;
    try {
      singleReport = generateSeoReport(analysisData);
    } catch (e) {
      console.warn(`Failed to generate report for ${normalizedUrl}:`, e);
    }

    const newPageResult = {
      url: normalizedUrl,
      analysisData: {
        title: analysisData.title || null,
        metaDescription: analysisData.metaDescription || null,
        metaKeywords: analysisData.metaKeywords || null,
        canonical: analysisData.canonical || null,
        robotsMeta: analysisData.robotsMeta || null,
        headings: analysisData.headings || { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
        images: (analysisData.images || []).map((img) => ({
          src: img.src,
          alt: img.alt,
          size: img.size,
          type: img.type,
        })),
        wordCount: analysisData.wordCount || 0,
        internalLinkCount: analysisData.internalLinkCount || 0,
        externalLinkCount: analysisData.externalLinkCount || 0,
        links: analysisData.links || [],
        socialLinks: analysisData.socialLinks || [],
        redirectUrls: analysisData.redirectUrls || [],
        redirectCount: analysisData.redirectCount || 0,
        textSample: analysisData.textSample || '',
        paragraphExcerpt: analysisData.paragraphExcerpt || [],
        isError: analysisData.isError || false,
        performanceMetrics: analysisData.performanceMetrics,
        scripts: (analysisData.scripts || []).map(s => ({
          src: s.src,
          size: s.size,
          isAsync: s.isAsync,
          isDefer: s.isDefer,
          isExternal: s.isExternal
        })),
        stylesheets: (analysisData.stylesheets || []).map(s => ({
          href: s.href,
          size: s.size,
          isExternal: s.isExternal
        }))
      },
      analysisReport: singleReport,
      analysisCount: 1,
      firstAnalyzedAt: new Date(),
      lastAnalyzedAt: new Date(),
    };

    const analysis = new SeoAnalysis({
      user: new mongoose.Types.ObjectId(userId),
      requestedUrl: normalizedUrl,
      analysisType: 'single_page',
      analyzedUrls: [normalizedUrl],
      totalPagesAnalyzed: 1,
      successfulPages: analysisData.isError ? 0 : 1,
      failedPages: analysisData.isError ? 1 : 0,
      results: [newPageResult],
    });

    await analysis.save();

    return {
      pageResult: newPageResult,
      isNew: true,
    };
  },

  async getAnalysisHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      analysisType?: AnalysisType;
      url?: string;
    } = {}
  ): Promise<{
    analyses: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, analysisType, url } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      user: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    };

    if (analysisType) {
      query.analysisType = analysisType;
    }

    if (url) {
      query.requestedUrl = { $regex: url, $options: 'i' };
    }

    const [analyses, total] = await Promise.all([
      SeoAnalysis.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SeoAnalysis.countDocuments(query),
    ]);

    return {
      analyses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getPageAnalysisHistory(
    userId: string,
    pageUrl: string
  ): Promise<any[]> {
    const normalizedUrl = normalizeUrl(pageUrl);

    const analyses = await SeoAnalysis.find({
      user: new mongoose.Types.ObjectId(userId),
      'results.url': normalizedUrl,
    })
      .sort({ createdAt: -1 })
      .select('results createdAt analysisType')
      .lean();

    const pageHistory = analyses
      .map((analysis) => {
        const pageResult = analysis.results.find(
          (r) => normalizeUrl(r.url) === normalizedUrl
        );
        if (pageResult) {
          return {
            analysisId: analysis._id,
            analysisType: analysis.analysisType,
            analyzedAt: analysis.createdAt,
            analysisCount: pageResult.analysisCount,
            lastAnalyzedAt: pageResult.lastAnalyzedAt,
            firstAnalyzedAt: pageResult.firstAnalyzedAt,
            isError: pageResult.analysisData.isError,
          };
        }
        return null;
      })
      .filter(Boolean);

    return pageHistory;
  },

  async getPageAnalysisCount(userId: string, pageUrl: string): Promise<number> {
    const normalizedUrl = normalizeUrl(pageUrl);

    const analyses = await SeoAnalysis.find({
      user: new mongoose.Types.ObjectId(userId),
      'results.url': normalizedUrl,
    }).select('results');

    let totalCount = 0;
    analyses.forEach((analysis) => {
      const pageResult = analysis.results.find(
        (r) => normalizeUrl(r.url) === normalizedUrl
      );
      if (pageResult) {
        totalCount += pageResult.analysisCount;
      }
    });

    return totalCount;
  },

  async getUserStats(userId: string): Promise<{
    totalAnalyses: number;
    totalPagesAnalyzed: number;
    uniqueUrlsAnalyzed: number;
    singlePageAnalyses: number;
    fullSiteAnalyses: number;
    partialSiteAnalyses: number;
  }> {
    const stats = await SeoAnalysis.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          totalPagesAnalyzed: { $sum: '$totalPagesAnalyzed' },
          uniqueUrlsAnalyzed: { $addToSet: '$requestedUrl' },
          singlePageAnalyses: {
            $sum: { $cond: [{ $eq: ['$analysisType', 'single_page'] }, 1, 0] },
          },
          fullSiteAnalyses: {
            $sum: { $cond: [{ $eq: ['$analysisType', 'full_site'] }, 1, 0] },
          },
          partialSiteAnalyses: {
            $sum: { $cond: [{ $eq: ['$analysisType', 'partial_site'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalAnalyses: 1,
          totalPagesAnalyzed: 1,
          uniqueUrlsAnalyzed: { $size: '$uniqueUrlsAnalyzed' },
          singlePageAnalyses: 1,
          fullSiteAnalyses: 1,
          partialSiteAnalyses: 1,
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalAnalyses: 0,
        totalPagesAnalyzed: 0,
        uniqueUrlsAnalyzed: 0,
        singlePageAnalyses: 0,
        fullSiteAnalyses: 0,
        partialSiteAnalyses: 0,
      };
    }

    return stats[0];
  },

  async getAnalysisById(
    analysisId: string,
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<Record<string, unknown> | null> {
    const { page = 1, limit = 20 } = options;

    const analysis = await SeoAnalysis.findOne({
      _id: new mongoose.Types.ObjectId(analysisId),
      user: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    }).lean();

    if (!analysis) return null;

    const totalResults = analysis.results?.length || 0;
    const totalPages = Math.ceil(totalResults / limit);
    const skip = (page - 1) * limit;
    const paginatedResults = (analysis.results || []).slice(skip, skip + limit);

    return {
      ...analysis,
      results: paginatedResults,
      pagination: {
        page,
        limit,
        totalResults,
        totalPages,
      },
    };
  },

  async softDeleteAnalysis(
    analysisId: string,
    userId: string
  ): Promise<boolean> {
    const result = await SeoAnalysis.updateOne(
      {
        _id: new mongoose.Types.ObjectId(analysisId),
        user: new mongoose.Types.ObjectId(userId),
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
      }
    );

    return result.modifiedCount > 0;
  },

  async restoreAnalysis(analysisId: string, userId: string): Promise<boolean> {
    const result = await SeoAnalysis.updateOne(
      {
        _id: new mongoose.Types.ObjectId(analysisId),
        user: new mongoose.Types.ObjectId(userId),
      },
      {
        isDeleted: false,
        deletedAt: null,
      }
    );

    return result.modifiedCount > 0;
  },

  async hardDeleteAnalysis(
    analysisId: string,
    userId: string
  ): Promise<boolean> {
    const result = await SeoAnalysis.deleteOne({
      _id: new mongoose.Types.ObjectId(analysisId),
      user: new mongoose.Types.ObjectId(userId),
    });

    return result.deletedCount > 0;
  },

  async getDeletedAnalyses(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{
    analyses: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      user: new mongoose.Types.ObjectId(userId),
      isDeleted: true,
    };

    const [analyses, total] = await Promise.all([
      SeoAnalysis.find(query)
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SeoAnalysis.countDocuments(query),
    ]);

    return {
      analyses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async createJob(userId: string, requestedUrl: string, urls: string[]): Promise<string> {
    const job = new SeoJob({
      user: new mongoose.Types.ObjectId(userId),
      requestedUrl,
      urls,
      totalUrls: urls.length,
      status: 'pending',
    });
    await job.save();
    
    // Start processing in background
    this.processJob(job._id.toString()).catch(err => {
      console.error(`Job ${job._id} processing error:`, err);
    });

    return job._id.toString();
  },

  async getJobStatus(jobId: string, userId: string) {
    const job = await SeoJob.findOne({
      _id: new mongoose.Types.ObjectId(jobId),
      user: new mongoose.Types.ObjectId(userId),
    }).lean();
    
    return job;
  },

  async processJob(jobId: string) {
    const job = await SeoJob.findById(jobId);
    if (!job) return;

    job.status = 'processing';
    await job.save();

    const results: ScrapedPageData[] = [];

    try {
      // PHASE 1: Fast Scraping (Metadata, Assets, Content)
      for (let i = 0; i < job.urls.length; i++) {
        const url = job.urls[i];
        
        const res = await scrapeWebPage(url, { 
          includePageSpeed: false, // Don't do slow API calls yet
          onProgress: async (partial) => {
            const existingIdx = results.findIndex(r => r.url === url);
            const fullPartial = { 
              ...createErrorPageData(url), 
              ...partial 
            } as ScrapedPageData;

            if (existingIdx > -1) {
              results[existingIdx] = fullPartial;
            } else {
              results.push(fullPartial);
            }
            job.results = [...results];
            await job.save();
          }
        }).catch(e => ({ url, isError: true } as ScrapedPageData));

        const finalIdx = results.findIndex(r => r.url === url);
        if (finalIdx > -1) {
          results[finalIdx] = res;
        } else {
          results.push(res);
        }

        job.results = [...results];
        job.processedUrls = i + 1;
        job.progress = Math.round((job.processedUrls / (job.totalUrls * 2)) * 100); // 50% max for scraping
        await job.save();
      }

      // PHASE 2: Slow Analysis (PageSpeed Metrics)
      // Usually we only run PageSpeed on the first page or main page to save time
      const mainUrl = job.urls[0];
      if (mainUrl) {
        job.status = 'processing'; // Update status to reflect performance phase
        await job.save();

        const mainIdx = results.findIndex(r => r.url === mainUrl);
        if (mainIdx > -1) {
          const perfData = await scrapeWebPage(mainUrl, { 
            includePageSpeed: true 
          }).catch(() => null);

          if (perfData?.performanceMetrics) {
            results[mainIdx].performanceMetrics = perfData.performanceMetrics;
            job.results = [...results];
            job.progress = 100;
            await job.save();
          }
        }
      }

      // Finalize job
      const saved = await this.saveAnalysis({
        userId: job.user.toString(),
        requestedUrl: job.requestedUrl,
        analysisType: job.urls.length > 1 ? 'full_site' : 'single_page',
        analyzedUrls: job.urls,
        results: results,
      });

      job.status = 'completed';
      job.results = results;
      job.analysisId = new mongoose.Types.ObjectId(saved.analysisId);
      job.progress = 100;
      await job.save();

    } catch (error: any) {
      console.error(`Error processing job ${jobId}:`, error);
      job.status = 'failed';
      job.error = error.message || 'Unknown error';
      await job.save();
    }
  },
};

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.href;
  } catch {
    return url;
  }
}

export default seoAnalysisService;
