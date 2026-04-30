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
	Zap,
	Gauge,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ScrapedPageData, SeoReport } from '@/types/seo.types';
import { SeoScoreBadge, SeoSectionScore } from './SeoScoreBadge';
import SeoDetailView from './SeoDetailView';

interface PageAnalysisCardProps {
	page: ScrapedPageData;
	report: SeoReport | null;
	index: number;
	onRescrape?: (url: string) => void;
	isRescraping?: boolean;
}

export default function PageAnalysisCard({
	page,
	report,
	index,
	onRescrape,
	isRescraping,
}: PageAnalysisCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [activeDetail, setActiveDetail] = useState<{
		type: 'images' | 'links';
		title: string;
		details: any;
	} | null>(null);

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

	const allIssues = report ? [
		...report.sections.meta.issues.map(i => ({ type: i.severity, message: i.message })),
		...report.sections.headings.issues.map(i => ({ type: i.severity, message: i.message })),
		...report.sections.images.issues.map(i => ({ type: i.severity, message: i.message })),
		...report.sections.content.issues.map(i => ({ type: i.severity, message: i.message })),
		...report.sections.links.issues.map(i => ({ type: i.severity, message: i.message })),
		...report.sections.technical.issues.map(i => ({ type: i.severity, message: i.message })),
		...(report.sections.performance?.issues || []).map(i => ({ type: i.severity, message: i.message })),
	] : [];

	const imagesWithoutAltCount = (page.images || []).filter((img) => !img.alt).length;

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
						{report && <SeoScoreBadge report={report} />}
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
								{ icon: ImageIcon, value: (page.images || []).length, error: imagesWithoutAltCount > 0 },
								{
									icon: Gauge,
									value: page.performanceMetrics?.desktop?.totalLoadTime
										? `${Math.round(page.performanceMetrics.desktop.totalLoadTime)}ms`
										: '-',
									mobileValue: page.performanceMetrics?.mobile?.totalLoadTime
										? `${Math.round(page.performanceMetrics.mobile.totalLoadTime)}ms`
										: null,
									warning: page.performanceMetrics?.desktop?.totalLoadTime && page.performanceMetrics.desktop.totalLoadTime > 3000,
								},
							].map((stat, i) => (
								<div
									key={i}
									className='flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 border border-transparent text-[10px] font-medium text-muted-foreground whitespace-nowrap'
								>
									<stat.icon className={`h-3 w-3 opacity-70 ${stat.warning ? 'text-yellow-600' : ''}`} />
									<span className={stat.warning ? 'text-yellow-600' : ''}>
										{stat.value}
										{stat.mobileValue && (
											<span className='ml-1 opacity-50 border-l border-border/50 pl-1'>
												📱 {stat.mobileValue}
											</span>
										)}
									</span>
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
									Health Check ({allIssues.length})
								</h4>
							</div>

							<div className='grid gap-1.5 max-h-64 overflow-y-auto pr-1'>
								{allIssues.length === 0 ? (
									<div className='flex items-center gap-2 px-2.5 py-2 rounded-lg border bg-emerald-500/5 border-emerald-500/10 text-emerald-700 text-[12px]'>
										<CheckCircle className='h-3 w-3 shrink-0' />
										<span className='font-medium'>No issues found</span>
									</div>
								) : (
									allIssues.map((issue, i) => (
										<div
											key={i}
											className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors ${
												issue.type === 'high'
													? 'bg-red-50 border-red-200 text-red-700'
													: issue.type === 'medium'
														? 'bg-yellow-50 border-yellow-200 text-yellow-700'
														: issue.type === 'low'
															? 'bg-blue-50 border-blue-200 text-blue-700'
															: 'bg-emerald-50 border-emerald-200 text-emerald-700'
											}`}
										>
											{issue.type === 'high' || issue.type === 'medium' || issue.type === 'low' ? (
												<AlertCircle className='h-3 w-3 shrink-0 mt-0.5' />
											) : (
												<CheckCircle className='h-3 w-3 shrink-0 mt-0.5' />
											)}
											<span className='font-medium flex-1'>
												{issue.message}
											</span>
										</div>
									))
								)}
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
										const headings = (page.headings || {})[level] || [];
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

								{/* SEO Report Sections */}
						{report && (
							<div className='lg:col-span-12 mt-4 pt-4 border-t border-border/40'>
								<div className='flex items-center gap-2 mb-3'>
									<div className='h-3 w-0.5 bg-primary/60 rounded-full' />
									<h4 className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80'>
										SEO Report
									</h4>
								</div>
								<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2'>
									{[
										{ label: 'Meta', section: report.sections.meta },
										{ label: 'Headings', section: report.sections.headings },
										{ label: 'Images', section: report.sections.images, type: 'images' },
										{ label: 'Content', section: report.sections.content },
										{ label: 'Links', section: report.sections.links, type: 'links' },
										{ label: 'Technical', section: report.sections.technical },
										...(report.sections.performance ? [{ label: 'Performance', section: report.sections.performance, type: 'performance' }] : []),
									].map(({ label, section, type }) => (
										<div key={label} className='rounded-lg border border-border/60 bg-muted/10 p-2.5 flex flex-col'>
											<div className='flex items-center justify-between mb-2'>
												<span className='text-[10px] font-bold uppercase flex items-center gap-1'>
													{label === 'Performance' && <Zap className='h-3 w-3' />}
													{label}
												</span>
												<span className={`text-[10px] font-bold ${
													section.score >= 80 ? 'text-emerald-600' :
													section.score >= 60 ? 'text-yellow-600' : 'text-red-600'
												}`}>
													{section.score}
												</span>
											</div>
											<SeoSectionScore score={section.score} />
											{section.issues.length > 0 && (
												<div className='mt-2 space-y-1 flex-1'>
													{section.issues.slice(0, 1).map((issue, i) => (
														<div key={i} className='text-[9px] text-muted-foreground truncate'>
															• {issue.message}
														</div>
													))}
												</div>
											)}
											{type && (section.details || section.metrics.invalidLinks > 0 || section.metrics.brokenImages > 0) && (
												<Button
													variant='outline'
													size='xs'
													className='mt-2 h-6 text-[9px] font-bold uppercase rounded-md bg-background'
													onClick={(e) => {
														e.stopPropagation();
														setActiveDetail({
															type: type as 'images' | 'links',
															title: `${label} Audit`,
															details: section.details,
														});
													}}
												>
													Audit Issues
												</Button>
											)}
										</div>
									))}
								</div>
							</div>
						)}

						{/* Performance Metrics Details */}
						{page.performanceMetrics && (
							<div className='lg:col-span-12 mt-4 pt-4 border-t border-border/40'>
								<div className='flex items-center gap-2 mb-3'>
									<div className='h-3 w-0.5 bg-amber-500/60 rounded-full' />
									<h4 className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80'>
										Performance Metrics
									</h4>
								</div>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<div className='text-[9px] font-bold text-primary flex items-center gap-1 mb-1 bg-primary/5 p-1 rounded-md w-fit'>
											💻 DESKTOP
										</div>
										<div className='grid grid-cols-2 gap-2'>
											<PerformanceMetricCard
												label='Load Time'
												value={page.performanceMetrics.desktop?.totalLoadTime ? `${Math.round(page.performanceMetrics.desktop.totalLoadTime)}ms` : '-'}
												rating={page.performanceMetrics.desktop?.totalLoadTime && page.performanceMetrics.desktop.totalLoadTime <= 3000 ? 'good' : page.performanceMetrics.desktop?.totalLoadTime && page.performanceMetrics.desktop.totalLoadTime <= 5000 ? 'needs-improvement' : page.performanceMetrics.desktop?.totalLoadTime ? 'poor' : null}
											/>
											<PerformanceMetricCard
												label='DNS Lookup'
												value={page.performanceMetrics.desktop?.dns ? `${Math.round(page.performanceMetrics.desktop.dns)}ms` : '-'}
												rating={null}
											/>
											<PerformanceMetricCard
												label='TCP Connect'
												value={page.performanceMetrics.desktop?.tcp ? `${Math.round(page.performanceMetrics.desktop.tcp)}ms` : '-'}
												rating={null}
											/>
											<PerformanceMetricCard
												label='First Byte'
												value={page.performanceMetrics.desktop?.firstByte ? `${Math.round(page.performanceMetrics.desktop.firstByte)}ms` : '-'}
												rating={null}
											/>
										</div>
									</div>

									<div className='space-y-2'>
										<div className='text-[9px] font-bold text-indigo-600 flex items-center gap-1 mb-1 bg-indigo-50 p-1 rounded-md w-fit'>
											📱 MOBILE
										</div>
										<div className='grid grid-cols-2 gap-2'>
											<PerformanceMetricCard
												label='Load Time'
												value={page.performanceMetrics.mobile?.totalLoadTime ? `${Math.round(page.performanceMetrics.mobile.totalLoadTime)}ms` : '-'}
												rating={page.performanceMetrics.mobile?.totalLoadTime && page.performanceMetrics.mobile.totalLoadTime <= 4000 ? 'good' : page.performanceMetrics.mobile?.totalLoadTime && page.performanceMetrics.mobile.totalLoadTime <= 7000 ? 'needs-improvement' : page.performanceMetrics.mobile?.totalLoadTime ? 'poor' : null}
											/>
											<PerformanceMetricCard
												label='DNS Lookup'
												value={page.performanceMetrics.mobile?.dns ? `${Math.round(page.performanceMetrics.mobile.dns)}ms` : '-'}
												rating={null}
											/>
											<PerformanceMetricCard
												label='TCP Connect'
												value={page.performanceMetrics.mobile?.tcp ? `${Math.round(page.performanceMetrics.mobile.tcp)}ms` : '-'}
												rating={null}
											/>
											<PerformanceMetricCard
												label='First Byte'
												value={page.performanceMetrics.mobile?.firstByte ? `${Math.round(page.performanceMetrics.mobile.firstByte)}ms` : '-'}
												rating={null}
											/>
										</div>
									</div>
								</div>

								{/* Web Vitals Section */}
								<div className='mt-4 pt-4 border-t border-dashed border-border/60'>
									<div className='flex items-center gap-2 mb-3'>
										<div className='h-3 w-0.5 bg-emerald-500/60 rounded-full' />
										<h4 className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80'>
											Core Web Vitals (Google)
										</h4>
									</div>
									<div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
										<PerformanceMetricCard
											label='First Contentful Paint'
											value={page.performanceMetrics.fcp ? `${(page.performanceMetrics.fcp / 1000).toFixed(1)}s` : '-'}
											rating={page.performanceMetrics.fcpRating}
										/>
										<PerformanceMetricCard
											label='Largest Contentful Paint'
											value={page.performanceMetrics.lcp ? `${(page.performanceMetrics.lcp / 1000).toFixed(1)}s` : '-'}
											rating={page.performanceMetrics.lcpRating}
										/>
										<PerformanceMetricCard
											label='Total Blocking Time'
											value={page.performanceMetrics.tbt ? `${Math.round(page.performanceMetrics.tbt)}ms` : '-'}
											rating={page.performanceMetrics.tbtRating}
										/>
										<PerformanceMetricCard
											label='Layout Shift (CLS)'
											value={page.performanceMetrics.cls !== null ? page.performanceMetrics.cls.toFixed(3) : '-'}
											rating={page.performanceMetrics.clsRating}
										/>
									</div>
								</div>
								<div className='mt-4 grid grid-cols-2 gap-2'>
									<PerformanceMetricCard
										label='Page Size'
										value={page.performanceMetrics.pageSizeFormatted || '-'}
										rating={page.performanceMetrics.pageSize && page.performanceMetrics.pageSize <= 2_000_000 ? 'good' : page.performanceMetrics.pageSize && page.performanceMetrics.pageSize <= 5_000_000 ? 'needs-improvement' : page.performanceMetrics.pageSize ? 'poor' : null}
									/>
									<PerformanceMetricCard
										label='Resource Count'
										value={`${(page.scripts?.length || 0) + (page.stylesheets?.length || 0)} files`}
										rating={null}
									/>
								</div>
								<div className='mt-2 text-[9px] text-muted-foreground/60 italic'>
									Note: Core Web Vitals are fetched in real-time from the Google PageSpeed Insights API.
								</div>
							</div>
						)}
					</div>
					
					{activeDetail && (
						<SeoDetailView
							isOpen={!!activeDetail}
							onClose={() => setActiveDetail(null)}
							title={activeDetail.title}
							details={activeDetail.details}
							type={activeDetail.type}
						/>
					)}
				</CardContent>
			)}
		</Card>
	);
}

interface PerformanceMetricCardProps {
	label: string;
	value: string;
	rating?: 'good' | 'needs-improvement' | 'poor' | null;
}

function PerformanceMetricCard({ label, value, rating }: PerformanceMetricCardProps) {
	const bgColor = rating === 'good' ? 'bg-emerald-500/5 border-emerald-500/20' :
					rating === 'needs-improvement' ? 'bg-yellow-500/5 border-yellow-500/20' :
					rating === 'poor' ? 'bg-red-500/5 border-red-500/20' :
					'bg-muted/10 border-border/40';
	const textColor = rating === 'good' ? 'text-emerald-600' :
					rating === 'needs-improvement' ? 'text-yellow-600' :
					rating === 'poor' ? 'text-red-600' :
					'text-muted-foreground';

	return (
		<div className={`rounded-lg border p-2.5 ${bgColor}`}>
			<div className='text-[9px] font-bold uppercase tracking-tight text-muted-foreground mb-1'>
				{label}
			</div>
			<div className={`text-sm font-bold ${textColor}`}>
				{value}
			</div>
		</div>
	);
}
