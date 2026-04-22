'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
	ArrowLeft,
	Trash2,
	RotateCcw,
	ExternalLink,
	Clock,
	Globe,
	FileText,
	Briefcase,
	Search,
} from 'lucide-react';
import { seoService } from '@/service/seo.service';
import type { SeoAnalysisHistoryItem } from '@/types/seo.types';

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
	single_page: 'Single Page',
	full_site: 'Full Site',
	partial_site: 'Partial Site',
};

const analysisTypeIcons: Record<string, React.ReactNode> = {
	single_page: <FileText size={16} />,
	full_site: <Globe size={16} />,
	partial_site: <Briefcase size={16} />,
};

export default function SEORocketHistory() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [analyses, setAnalyses] = useState<SeoAnalysisHistoryItem[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [showDeleted, setShowDeleted] = useState(
		searchParams.get('deleted') === 'true',
	);

	const fetchHistory = async () => {
		setLoading(true);
		try {
			const response = showDeleted
				? await seoService.getDeletedAnalyses({ page, limit: 10 })
				: await seoService.getAnalysisHistory({ page, limit: 10 });
			if (response.success && response.data) {
				setAnalyses(response.data.analyses);
				setTotal(response.data.total);
			}
		} catch (error) {
			console.error('Failed to fetch history:', error);
			toast.error('Failed to load analysis history');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchHistory();
	}, [page, showDeleted]);

	const handleSoftDelete = async (id: string) => {
		setDeletingId(id);
		try {
			const response = await seoService.softDeleteAnalysis(id);
			if (response.success) {
				toast.success('Analysis deleted');
				fetchHistory();
			}
		} catch (error) {
			console.error('Failed to delete:', error);
			toast.error('Failed to delete analysis');
		} finally {
			setDeletingId(null);
		}
	};

	const handleRestore = async (id: string) => {
		setDeletingId(id);
		try {
			const response = await seoService.restoreAnalysis(id);
			if (response.success) {
				toast.success('Analysis restored');
				fetchHistory();
			}
		} catch (error) {
			console.error('Failed to restore:', error);
			toast.error('Failed to restore analysis');
		} finally {
			setDeletingId(null);
		}
	};

	const handleHardDelete = async (id: string) => {
		if (
			!confirm(
				'Are you sure you want to permanently delete this analysis? This cannot be undone.',
			)
		) {
			return;
		}
		setDeletingId(id);
		try {
			const response = await seoService.hardDeleteAnalysis(id);
			if (response.success) {
				toast.success('Analysis permanently deleted');
				fetchHistory();
			}
		} catch (error) {
			console.error('Failed to permanently delete:', error);
			toast.error('Failed to delete analysis');
		} finally {
			setDeletingId(null);
		}
	};

	const handleRerun = (analysis: SeoAnalysisHistoryItem) => {
		const url = encodeURIComponent(analysis.requestedUrl);
		navigate(`/dashboard/seo-rocket?url=${url}&rerun=${analysis._id}`);
	};

	const totalPages = Math.ceil(total / 10);

	return (
		<div className='max-w-5xl mx-auto space-y-6'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<button
						onClick={() => navigate('/dashboard/seo-rocket')}
						className='p-2 rounded-lg hover:bg-muted transition-colors'
					>
						<ArrowLeft size={20} />
					</button>
					<div>
						<h1 className='text-2xl font-bold'>Analysis History</h1>
						<p className='text-sm text-muted-foreground'>
							{showDeleted
								? 'View deleted analyses'
								: 'View your previous analyses'}
						</p>
					</div>
				</div>
				<button
					onClick={() => {
						setShowDeleted(!showDeleted);
						setPage(1);
					}}
					className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						showDeleted
							? 'bg-destructive/10 text-destructive'
							: 'bg-muted hover:bg-muted/80'
					}`}
				>
					{showDeleted ? 'Show Active' : 'Show Deleted'}
				</button>
			</div>

			{loading ? (
				<div className='flex items-center justify-center py-20'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
				</div>
			) : analyses.length === 0 ? (
				<div className='text-center py-20'>
					<Search
						size={48}
						className='mx-auto text-muted-foreground/30 mb-4'
					/>
					<h3 className='text-lg font-medium'>No analyses found</h3>
					<p className='text-muted-foreground'>
						{showDeleted
							? 'You have no deleted analyses'
							: 'Run your first SEO analysis to see it here'}
					</p>
					{!showDeleted && (
						<button
							onClick={() => navigate('/dashboard/seo-rocket')}
							className='mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium'
						>
							New Analysis
						</button>
					)}
				</div>
			) : (
				<>
					<div className='space-y-3'>
						{analyses.map((analysis) => (
							<div
								key={analysis._id}
								className={`p-4 rounded-xl border transition-colors ${
									showDeleted
										? 'bg-destructive/5 border-destructive/20'
										: 'bg-card/50 border-border hover:border-primary/30'
								}`}
							>
								<div className='flex items-start justify-between gap-4'>
									<div className='flex-1 min-w-0'>
										<div className='flex items-center gap-2 mb-2'>
											<span className='text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1'>
												{
													analysisTypeIcons[
														analysis.analysisType as keyof typeof analysisTypeIcons
													]
												}
												{ANALYSIS_TYPE_LABELS[analysis.analysisType]}
											</span>
											<span className='text-xs text-muted-foreground flex items-center gap-1'>
												<Clock size={12} />
												{new Date(analysis.createdAt).toLocaleDateString()}
											</span>
											<span className='text-xs text-muted-foreground flex items-center gap-1'>
												<FileText size={12} />
												{analysis.totalPagesAnalyzed} pages
											</span>
										</div>
										<a
											href={analysis.requestedUrl}
											target='_blank'
											rel='noopener noreferrer'
											className='text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 break-all'
										>
											{analysis.requestedUrl}
											<ExternalLink size={12} />
										</a>
										<p className='text-xs text-muted-foreground mt-1'>
											{analysis.successfulPages} successful,{' '}
											{analysis.failedPages} failed
										</p>
									</div>
									<div className='flex items-center gap-2'>
										{showDeleted ? (
											<>
												<button
													onClick={() => handleRestore(analysis._id)}
													disabled={deletingId === analysis._id}
													className='p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50'
													title='Restore'
												>
													<RotateCcw size={16} />
												</button>
												<button
													onClick={() => handleHardDelete(analysis._id)}
													disabled={deletingId === analysis._id}
													className='p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50'
													title='Permanently delete'
												>
													<Trash2 size={16} />
												</button>
											</>
										) : (
											<>
												<button
													onClick={() => handleRerun(analysis)}
													className='p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors'
													title='Re-run analysis'
												>
													<RotateCcw size={16} />
												</button>
												<button
													onClick={() =>
														navigate(
															`/dashboard/seo-rocket/results?id=${analysis._id}`,
														)
													}
													className='p-2 rounded-lg hover:bg-muted transition-colors'
													title='View results'
												>
													<FileText size={16} />
												</button>
												<button
													onClick={() => handleSoftDelete(analysis._id)}
													disabled={deletingId === analysis._id}
													className='p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50'
													title='Delete'
												>
													<Trash2 size={16} />
												</button>
											</>
										)}
									</div>
								</div>
							</div>
						))}
					</div>

					{totalPages > 1 && (
						<div className='flex items-center justify-center gap-2'>
							<button
								onClick={() => setPage(Math.max(1, page - 1))}
								disabled={page === 1}
								className='px-3 py-1.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								Previous
							</button>
							<span className='text-sm text-muted-foreground'>
								Page {page} of {totalPages}
							</span>
							<button
								onClick={() => setPage(Math.min(totalPages, page + 1))}
								disabled={page === totalPages}
								className='px-3 py-1.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								Next
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
