import { Request, Response } from 'express';
import { asyncHandler } from '../../../middleware/errorHandler';
import { seoAnalysisService } from '../service/seoAnalysis.service';
import { mailService } from '../../../services/mailService';
import User from '../../../models/User';
import { ISeoReport } from '../../../types';

export const sendSeoReportEmail = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { analysisId, targetEmail } = req.body;

    if (!analysisId) {
      res.status(400).json({
        success: false,
        error: 'Analysis ID is required',
      });
      return;
    }

    // 1. Get the analysis
    const analysis = await seoAnalysisService.getAnalysisById(analysisId, userId);
    if (!analysis) {
      res.status(404).json({
        success: false,
        error: 'Analysis not found',
      });
      return;
    }

    // 2. Get user details
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const recipient = targetEmail || user.email;

    // 3. Send the email
    // Note: analysis.results[0].analysisReport contains the report data
    const reportData = (analysis.results as any[])?.[0]?.analysisReport as ISeoReport;
    const pageUrl = (analysis.results as any[])?.[0]?.url;

    if (!reportData) {
      res.status(400).json({
        success: false,
        error: 'No report data found for this analysis',
      });
      return;
    }

    try {
      await mailService.sendSeoReport({
        to: recipient,
        userName: user.userName,
        pageUrl,
        report: reportData,
      });

      res.json({
        success: true,
        message: `SEO report sent successfully to ${recipient}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to send SEO report email',
      });
    }
  }
);
