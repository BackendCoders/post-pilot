import {
	BarChart3,
	AlertTriangle,
	CheckCircle,
	Image,
	Link as LinkIcon,
	FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageAnalysisCard from './PageAnalysisCard';
import type { ScrapedPageData } from '@/types/seo.types';

interface AnalysisResultsProps {
	results: ScrapedPageData[];
	onRescrape?: (url: string) => void;
	rescrapingUrl?: string | null;
}

export default function AnalysisResults({ results, onRescrape, rescrapingUrl }: AnalysisResultsProps) {
	if (results.length === 0) return null;

	const totalWords = results.reduce((sum, p) => sum + p.wordCount, 0);
	const totalImages = results.reduce((sum, p) => sum + p.images.length, 0);
	const totalImagesWithoutAlt = results.reduce(
		(sum, p) => sum + p.images.filter((img) => !img.alt).length,
		0,
	);
	const totalLinks = results.reduce(
		(sum, p) => sum + p.internalLinkCount + p.externalLinkCount,
		0,
	);
	const pagesWithMetaDesc = results.filter((p) => p.metaDescription).length;
	const pagesWithH1 = results.filter((p) => p.headings.h1.length > 0).length;
	const avgWordCount = Math.round(totalWords / results.length);

	return (
		<div className='space-y-6 animate-in fade-in duration-500'>
			{/* Header Section */}
			<div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4'>
				<div className='space-y-1'>
					<h2 className='text-xl font-bold tracking-tight'>Analysis Results</h2>
					<p className='text-sm text-muted-foreground'>
						Overview of SEO metrics for your selected content.
					</p>
				</div>
				<Badge
					variant='secondary'
					className='w-fit rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider'
				>
					{results.length} {results.length === 1 ? 'Page' : 'Pages'} Analyzed
				</Badge>
			</div>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
				<Card className='rounded-xl border-border bg-card shadow-none hover:shadow-sm transition-all duration-200'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							Pages
						</CardTitle>
						<BarChart3 className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className='text-2xl font-bold tracking-tight'>
							{results.length}
						</div>
						<p className='text-[11px] text-muted-foreground mt-1'>
							<span className='font-medium text-foreground'>
								{pagesWithMetaDesc}
							</span>{' '}
							with meta description (
							{Math.round((pagesWithMetaDesc / results.length) * 100)}%)
						</p>
					</CardContent>
				</Card>

				<Card className='rounded-xl border-border bg-card shadow-none hover:shadow-sm transition-all duration-200'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							Avg Word Count
						</CardTitle>
						<FileText className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className='text-2xl font-bold tracking-tight'>
							{avgWordCount.toLocaleString()}
						</div>
						<p className='text-[11px] text-muted-foreground mt-1'>
							Total:{' '}
							<span className='font-medium text-foreground'>
								{totalWords.toLocaleString()}
							</span>{' '}
							words
						</p>
					</CardContent>
				</Card>

				<Card className='rounded-xl border-border bg-card shadow-none hover:shadow-sm transition-all duration-200'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							Images
						</CardTitle>
						<Image className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className='text-2xl font-bold tracking-tight'>
							{totalImages}
						</div>
						<p className='text-[11px] mt-1 flex items-center gap-1.5'>
							{totalImagesWithoutAlt > 0 ? (
								<>
									<AlertTriangle className='h-3 w-3 text-destructive' />
									<span className='text-destructive font-medium'>
										{totalImagesWithoutAlt} missing alt tags
									</span>
								</>
							) : (
								<>
									<CheckCircle className='h-3 w-3 text-emerald-500' />
									<span className='text-emerald-600 font-medium'>
										All have alt text
									</span>
								</>
							)}
						</p>
					</CardContent>
				</Card>

				<Card className='rounded-xl border-border bg-card shadow-none hover:shadow-sm transition-all duration-200'>
					<CardHeader className='flex flex-row items-center justify-between pb-1 pt-4 px-4 space-y-0'>
						<CardTitle className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
							Links
						</CardTitle>
						<LinkIcon className='h-4 w-4 text-primary/70' />
					</CardHeader>
					<CardContent className='px-4 pb-4'>
						<div className='text-2xl font-bold tracking-tight'>
							{totalLinks}
						</div>
						<p className='text-[11px] text-muted-foreground mt-1'>
							<span className='font-medium text-foreground'>
								{pagesWithH1}/{results.length}
							</span>{' '}
							with H1 ({Math.round((pagesWithH1 / results.length) * 100)}%)
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Details List */}
			<div className='space-y-4 pt-2'>
				<div className='flex items-center gap-2'>
					<h3 className='text-sm font-bold uppercase tracking-widest text-muted-foreground'>
						Detailed Breakdown
					</h3>
					<div className='h-px flex-1 bg-border' />
				</div>
				<div className='grid gap-4'>
					{results.map((page, index) => (
						<div
							key={page.url}
							className='group transition-transform duration-200 active:scale-[0.99]'
						>
							<PageAnalysisCard
								page={page}
								index={index}
								onRescrape={onRescrape}
								isRescraping={rescrapingUrl === page.url}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
