import { Request, Response } from 'express';
import { asyncHandler } from '../../../middleware/errorHandler';
import {
  seoAnalysisService,
  AnalysisType,
} from '../service/seoAnalysis.service';
import { ScrapedPageData } from '../../../types';

export const saveAnalysis = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { requestedUrl, analysisType, analyzedUrls, results } = req.body;

    if (!requestedUrl || !analysisType || !results) {
      res.status(400).json({
        success: false,
        error: 'requestedUrl, analysisType, and results are required',
      });
      return;
    }

    const validTypes: AnalysisType[] = [
      'single_page',
      'full_site',
      'partial_site',
    ];
    if (!validTypes.includes(analysisType)) {
      res.status(400).json({
        success: false,
        error:
          'Invalid analysisType. Must be single_page, full_site, or partial_site',
      });
      return;
    }

    const result = await seoAnalysisService.saveAnalysis({
      userId,
      requestedUrl,
      analysisType,
      analyzedUrls: analyzedUrls || [],
      results: results as ScrapedPageData[],
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Analysis saved successfully',
    });
  }
);

export const updatePageAnalysis = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { pageUrl, analysisData } = req.body;

    if (!pageUrl || !analysisData) {
      res.status(400).json({
        success: false,
        error: 'pageUrl and analysisData are required',
      });
      return;
    }

    const result = await seoAnalysisService.updateOrCreatePageAnalysis(
      userId,
      pageUrl,
      analysisData as ScrapedPageData
    );

    res.json({
      success: true,
      data: result,
      message: result.isNew ? 'Page analysis created' : 'Page analysis updated',
    });
  }
);

export const getAnalysisHistory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { page = '1', limit = '20', analysisType, url } = req.query;

    const result = await seoAnalysisService.getAnalysisHistory(userId, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      analysisType: analysisType as AnalysisType | undefined,
      url: url as string | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  }
);

export const getPageAnalysisHistory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { url } = req.params;

    if (!url) {
      res.status(400).json({
        success: false,
        error: 'URL parameter is required',
      });
      return;
    }

    const history = await seoAnalysisService.getPageAnalysisHistory(
      userId,
      decodeURIComponent(url as string)
    );

    res.json({
      success: true,
      data: history,
    });
  }
);

export const getPageAnalysisCount = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { url } = req.query;

    if (!url) {
      res.status(400).json({
        success: false,
        error: 'url query parameter is required',
      });
      return;
    }

    const count = await seoAnalysisService.getPageAnalysisCount(
      userId,
      decodeURIComponent(url as string)
    );

    res.json({
      success: true,
      data: { count },
    });
  }
);

export const getUserSeoStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const stats = await seoAnalysisService.getUserStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  }
);

export const getAnalysisById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Analysis ID is required',
      });
      return;
    }

    const analysis = await seoAnalysisService.getAnalysisById(id, userId);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'Analysis not found',
      });
      return;
    }

    res.json({
      success: true,
      data: analysis,
    });
  }
);

export const softDeleteAnalysis = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Analysis ID is required',
      });
      return;
    }

    const result = await seoAnalysisService.softDeleteAnalysis(id, userId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Analysis not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Analysis soft deleted',
    });
  }
);

export const restoreAnalysis = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Analysis ID is required',
      });
      return;
    }

    const result = await seoAnalysisService.restoreAnalysis(id, userId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Analysis not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Analysis restored',
    });
  }
);

export const hardDeleteAnalysis = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Analysis ID is required',
      });
      return;
    }

    const result = await seoAnalysisService.hardDeleteAnalysis(id, userId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Analysis not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Analysis permanently deleted',
    });
  }
);

export const getDeletedAnalyses = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { page = '1', limit = '20' } = req.query;

    const result = await seoAnalysisService.getDeletedAnalyses(userId, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.json({
      success: true,
      data: result,
    });
  }
);
