import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware';
import { analyzeUrl, countSitePages, scrapeMultipleWebPages } from './scrapper';

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
    const { urls } = req.body as {
      urls: string[];
    };

    const data = await scrapeMultipleWebPages(urls);

    res.status(200).json({
      success: true,
      requestedCount: urls.length,
      scrapedCount: data.length,
      failedCount: urls.length - data.length,
      data,
      message: 'Bulk web page scrape completed successfully',
    });
  }
);
