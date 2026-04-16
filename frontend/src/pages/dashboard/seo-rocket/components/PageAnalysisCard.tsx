'use client';

import { useState } from 'react';
import {
	ChevronDown,
	ChevronUp,
	AlertCircle,
	CheckCircle,
	Image as ImageIcon,
	Link as LinkIcon,
	FileText,
	ExternalLink,
	Hash,
	Info,
	RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ScrapedPageData } from '@/types/seo.types';

interface PageAnalysisCardProps {
	page: ScrapedPageData;
	index: number;
	onRescrape?: (url: string) => void;
	isRescraping?: boolean;
}

export default function PageAnalysisCard({
	page,
	index,
	onRescrape,
	isRescraping,
}: PageAnalysisCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	if (page.isError) {
		return (
			<Card className='overflow-hidden border-destructive/20 bg-card rounded-xl transition-all duration-200 hover:shadow-sm'>
				<CardHeader className='p-3'>
					<div className='flex items-center justify-between gap-3'>
						<div className='flex items-center gap-3 min-w-0'>
							<span className='shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-destructive/10 text-destructive text-[10px] font-bold border border-destructive/20'>
								{index + 1}
							</span>
							<div className='min-w-0'>
								<h3 className='text-sm font-semibold tracking-tight text-destructive'>
									Failed to analyze page
								</h3>
								<p className='text-[11px] text-muted-foreground mt-0.5 truncate font-mono opacity-80'>
									{page.url}
								</p>
							</div>
						</div>
						<AlertCircle className='h-4 w-4 text-destructive shrink-0' />
					</div>
				</CardHeader>
				<CardContent className='px-3 pb-3 pt-0'>
					<div className='rounded-lg border border-destructive/10 bg-destructive/5 p-2.5'>
						<p className='text-xs text-destructive/90 leading-relaxed'>
							This page could not be scraped or returned an error. Please verify
							the URL or your connection settings.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const issues: { type: 'warning' | 'error' | 'success'; message: string }[] =
		[];

	if (!page.metaDescription) {
		issues.push({ type: 'warning', message: 'Missing meta description' });
	} else if (page.metaDescription.length < 120) {
		issues.push({ type: 'warning', message: 'Meta description too short' });
	} else if (page.metaDescription.length > 160) {
		issues.push({ type: 'warning', message: 'Meta description too long' });
	} else {
		issues.push({ type: 'success', message: 'Optimal meta description' });
	}

	if (page.headings.h1.length === 0) {
		issues.push({ type: 'error', message: 'Missing H1 heading' });
	} else if (page.headings.h1.length > 1) {
		issues.push({
			type: 'warning',
			message: `Multiple H1s (${page.headings.h1.length})`,
		});
	} else {
		issues.push({ type: 'success', message: 'Single H1 heading found' });
	}

	const imagesWithoutAlt = page.images.filter((img) => !img.alt).length;
	if (imagesWithoutAlt > 0) {
		issues.push({
			type: 'warning',
			message: `${imagesWithoutAlt} images missing alt text`,
		});
	} else if (page.images.length > 0) {
		issues.push({ type: 'success', message: 'All images have alt text' });
	}

	if (page.wordCount < 300) {
		issues.push({ type: 'warning', message: 'Low word count (< 300)' });
	} else {
		issues.push({
			type: 'success',
			message: `Good word count (${page.wordCount})`,
		});
	}

	const imagesWithoutAltCount = page.images.filter((img) => !img.alt).length;

	return (
		<Card className='overflow-hidden border-border bg-card transition-all duration-200 hover:shadow-sm hover:border-border/80 rounded-xl group'>
			<CardHeader
				className='p-3 cursor-pointer select-none hover:bg-muted/30 transition-colors'
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<div className='flex flex-col md:flex-row md:items-center justify-between gap-3'>
					<div className='flex items-center gap-3 min-w-0'>
						<span className='shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-bold border border-primary/20'>
							{index + 1}
						</span>
						<div className='min-w-0'>
							<h3 className='text-sm font-semibold tracking-tight text-foreground truncate group-hover:text-primary transition-colors'>
								{page.title || 'Untitled Page'}
							</h3>
							<p className='text-[11px] text-muted-foreground truncate font-mono opacity-70 mt-0.5'>
								{page.url}
							</p>
						</div>
					</div>

					<div className='flex items-center justify-between md:justify-end gap-2.5'>
						<div className='flex items-center gap-1.5'>
							{[
								{ icon: FileText, value: page.wordCount },
								{
									icon: LinkIcon,
									value: page.internalLinkCount + page.externalLinkCount,
								},
								{
									icon: ImageIcon,
									value: page.images.length,
									error: imagesWithoutAltCount > 0,
								},
							].map((stat, i) => (
								<div
									key={i}
									className='flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 border border-transparent text-[10px] font-medium text-muted-foreground whitespace-nowrap'
								>
									<stat.icon className='h-3 w-3 opacity-70' />
									{stat.value}
									{stat.error && (
										<span className='ml-0.5 text-[9px] font-bold text-destructive px-1 bg-destructive/10 rounded-sm'>
											!
										</span>
									)}
								</div>
							))}
						</div>

						{onRescrape && (
							<Button
								variant='ghost'
								size='icon-xs'
								onClick={(e) => {
									e.stopPropagation();
									onRescrape(page.url);
								}}
								disabled={isRescraping}
								className='shrink-0'
								title='Rescrape this page'
							>
								<RefreshCw
									className={`h-3 w-3 ${isRescraping ? 'animate-spin' : ''}`}
								/>
							</Button>
						)}

						<div className='p-1 rounded-md bg-muted/50 group-hover:bg-muted transition-colors ml-1'>
							{isExpanded ? (
								<ChevronUp className='h-3.5 w-3.5 text-muted-foreground' />
							) : (
								<ChevronDown className='h-3.5 w-3.5 text-muted-foreground' />
							)}
						</div>
					</div>
				</div>
			</CardHeader>

			{isExpanded && (
				<CardContent className='px-3 pb-3 pt-0 border-t border-border/40 bg-card animate-in fade-in slide-in-from-top-1 duration-200'>
					<div className='grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4'>
						{/* Health Check */}
						<div className='lg:col-span-4'>
							<div className='flex items-center gap-2 mb-2.5'>
								<div className='h-3 w-0.5 bg-primary/60 rounded-full' />
								<h4 className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80'>
									Health Check
								</h4>
							</div>

							<div className='grid gap-1.5'>
								{issues.map((issue, i) => (
									<div
										key={i}
										className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[12px] transition-colors ${
											issue.type === 'error'
												? 'bg-destructive/5 border-destructive/10 text-destructive'
												: issue.type === 'warning'
													? 'bg-yellow-500/5 border-yellow-500/10 text-yellow-700'
													: 'bg-emerald-500/5 border-emerald-500/10 text-emerald-700'
										}`}
									>
										{issue.type === 'success' ? (
											<CheckCircle className='h-3 w-3 shrink-0' />
										) : (
											<AlertCircle className='h-3 w-3 shrink-0' />
										)}
										<span className='font-medium truncate'>
											{issue.message}
										</span>
									</div>
								))}
							</div>
						</div>

						{/* SEO Attributes */}
						<div className='lg:col-span-8 space-y-3'>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
								{[
									{ label: 'Canonical', value: page.canonical, icon: LinkIcon },
									{ label: 'Robots', value: page.robotsMeta, icon: Info },
									{
										label: 'Meta Keywords',
										value: page.metaKeywords,
										icon: Hash,
									},
									{
										label: 'Redirects',
										value: page.redirectCount,
										icon: ExternalLink,
									},
								].map((item, i) => (
									<div
										key={i}
										className='rounded-lg border border-border/60 bg-muted/10 p-2.5 flex flex-col gap-1.5 h-full'
									>
										<div className='flex items-center gap-1.5 opacity-60 shrink-0'>
											<item.icon className='h-3 w-3' />
											<span className='text-[10px] font-bold uppercase tracking-tight'>
												{item.label}
											</span>
										</div>
										{/* Changed 'truncate' to 'break-all' and added 'leading-normal' 
                    to handle extremely long URLs or keyword strings safely.
                */}
										<p className='text-xs font-medium text-foreground/90 break-all leading-normal selection:bg-primary/20'>
											{item.value || (
												<span className='text-muted-foreground/50 italic font-normal'>
													Zero
												</span>
											)}
										</p>
									</div>
								))}
							</div>

							{page.redirectUrls.length > 0 && (
								<div className='rounded-lg border border-border/60 bg-muted/10 p-2.5'>
									<div className='flex items-center gap-1.5 mb-2 opacity-60'>
										<ExternalLink className='h-3 w-3' />
										<span className='text-[10px] font-bold uppercase tracking-tight'>
											Redirect Chain
										</span>
									</div>
									<div className='space-y-1.5 relative pl-3 before:absolute before:left-1 before:top-1 before:bottom-1 before:w-px before:bg-border/60'>
										{page.redirectUrls.map((url, i) => (
											<div
												key={i}
												className='text-[11px] break-all text-muted-foreground font-mono leading-relaxed bg-muted/30 p-1 rounded-sm'
											>
												<span className='text-primary/60 mr-1 font-bold'>
													{i + 1}.
												</span>
												{url}
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Heading Structure */}
						<div className='lg:col-span-12'>
							<div className='flex items-center gap-2 mb-3 mt-1'>
								<div className='h-3 w-0.5 bg-primary/60 rounded-full' />
								<h4 className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80'>
									Heading Structure
								</h4>
							</div>
							<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2'>
								{(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map(
									(level) => {
										const headings = page.headings[level] || [];
										const hasItems = headings.length > 0;
										return (
											<div
												key={level}
												className={`rounded-lg border transition-colors p-2 ${hasItems ? 'bg-card border-border shadow-sm' : 'bg-muted/20 border-border/40 opacity-60'}`}
											>
												<div className='flex items-center justify-between mb-2'>
													<span className='text-[10px] font-bold uppercase text-muted-foreground'>
														{level}
													</span>
													<Badge
														variant={hasItems ? 'secondary' : 'outline'}
														className='h-4 px-1 text-[9px] rounded-sm'
													>
														{headings.length}
													</Badge>
												</div>
												<div className='space-y-1 overflow-hidden'>
													{hasItems ? (
														headings.slice(0, 2).map((h, i) => (
															<div
																key={i}
																className='text-[10px] leading-tight truncate text-foreground/80 border-l border-primary/20 pl-1.5'
															>
																{h}
															</div>
														))
													) : (
														<span className='text-[10px] italic text-muted-foreground/50'>
															No data
														</span>
													)}
												</div>
											</div>
										);
									},
								)}
							</div>
						</div>
					</div>
				</CardContent>
			)}
		</Card>
	);
}
