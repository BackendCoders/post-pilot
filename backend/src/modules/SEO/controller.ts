import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import { analyzeUrl, countSitePages, scrapeMultipleWebPages } from './scrapper';
import { seoAnalysisService } from './service/seoAnalysis.service';

export const scrapeSeoTarget = asyncHandler(
  async (req: Request, res: Response) => {
    const { url, mode, fullSite } = req.body as {
      url: string;
      mode?: 'auto' | 'page' | 'site';
      fullSite?: boolean;
    };

    const result = await analyzeUrl({ url, mode, fullSite });

    res.status(200).json({
      success: true,
      mode: result.mode,
      requestedUrl: result.requestedUrl,
      normalizedUrl: result.normalizedUrl,
      data: result.data,
      message:
        result.mode === 'site'
          ? 'Full site analysis completed successfully'
          : 'Web page scrape completed successfully',
    });
  }
);

export const countSeoPages = asyncHandler(
  async (req: Request, res: Response) => {
    const { url } = req.body as {
      url: string;
    };

    const result = await countSitePages(url);

    res.status(200).json({
      success: true,
      requestedUrl: result.requestedUrl,
      analyzedDomain: result.analyzedDomain,
      totalPages: result.totalPages,
      sitemapUrls: result.sitemapUrls,
      categorizedUrls: result.categorizedUrls,
      urls: result.urls,
      message: 'Total sitemap pages counted successfully',
    });
  }
);

export const scrapeSeoBulkUrls = asyncHandler(
  async (req: Request, res: Response) => {
    const { urls, requestedUrl, isFullSite } = req.body as {
      urls: string[];
      requestedUrl?: string;
      isFullSite?: boolean;
    };

    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Use Job system for bulk scrape
    const jobId = await seoAnalysisService.createJob(userId, requestedUrl || urls[0] || '', urls);

    res.status(202).json({
      success: true,
      jobId,
      message: 'Bulk analysis started in background',
    });
  }
);

export const getSeoJobStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId?.toString();

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const job = await seoAnalysisService.getJobStatus(id as string, userId);

    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  }
);
