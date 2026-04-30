'use client';

import { useState, useMemo } from 'react';
import {
	Check,
	FileText,
	Globe,
	CheckSquare,
	MinusSquare,
	Search,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSeoAnalysis } from '@/query/seo.query';
import type { SitePageCountResult } from '@/types/seo.types';

interface SitemapViewProps {
	sitemap: SitePageCountResult;
	selectedUrls: string[];
	onToggleUrl: (url: string) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onAnalyze: (urls: string[]) => void;
	isAnalyzing: boolean;
}

const ITEMS_PER_PAGE = 50;

// Dynamic category configuration will be derived from sitemap data
const getCategoryColor = (category: string) => {
	const colors = [
		'bg-blue-500',
		'bg-green-500',
		'bg-purple-500',
		'bg-orange-500',
		'bg-zinc-500',
		'bg-slate-400',
		'bg-pink-500',
		'bg-cyan-500',
		'bg-yellow-500',
	];
	let hash = 0;
	for (let i = 0; i < category.length; i++) {
		hash = category.charCodeAt(i) + ((hash << 5) - hash);
	}
	return colors[Math.abs(hash) % colors.length];
};

export default function SitemapView({
	sitemap,
	selectedUrls,
	onToggleUrl,
	onSelectAll,
	onDeselectAll,
	onAnalyze,
	isAnalyzing,
}: SitemapViewProps) {
	const { selectByCategory } = useSeoAnalysis();
	const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
	const [_expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());
	const [searchQuery, setSearchQuery] = useState('');
	const [currentPage, setCurrentPage] = useState(1);

	// Filter by category
	const categoryFilteredUrls = useMemo(() => {
		if (activeCategory === 'all') return sitemap.urls;
		return sitemap.categorizedUrls[activeCategory] || [];
	}, [sitemap, activeCategory]);

	// Filter by search query
	const filteredUrls = useMemo(() => {
		if (!searchQuery.trim()) return categoryFilteredUrls;
		const q = searchQuery.toLowerCase();
		return categoryFilteredUrls.filter((url) => url.toLowerCase().includes(q));
	}, [categoryFilteredUrls, searchQuery]);

	// Pagination
	const totalPages = Math.ceil(filteredUrls.length / ITEMS_PER_PAGE);
	const paginatedUrls = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredUrls.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredUrls, currentPage]);

	// Reset page when filter changes
	const handleCategoryChange = (cat: string | 'all') => {
		setActiveCategory(cat);
		setCurrentPage(1);
	};

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		setCurrentPage(1);
	};

	const toggleExpanded = (url: string) => {
		setExpandedUrls((prev) => {
			const next = new Set(prev);
			if (next.has(url)) next.delete(url);
			else next.add(url);
			return next;
		});
	};

	const getCategoryForUrl = (url: string): string => {
		for (const [cat, urls] of Object.entries(sitemap.categorizedUrls)) {
			if (urls.includes(url)) return cat;
		}
		return 'other';
	};

	return (
		<Card className='border-none shadow-none bg-transparent'>
			<CardHeader className='px-0 pt-0 pb-4'>
				<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2'>
					<div className='space-y-1'>
						<CardTitle className='text-lg font-bold tracking-tight flex items-center gap-2'>
							Sitemap Explorer
							<Badge
								variant='secondary'
								className='rounded-md font-mono text-[10px]'
							>
								{sitemap.totalPages}
							</Badge>
						</CardTitle>
						<CardDescription className='text-xs flex items-center gap-1.5'>
							<Globe className='h-3 w-3' />
							{sitemap.analyzedDomain}
						</CardDescription>
					</div>

					<div className='flex items-center gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={onDeselectAll}
							className='h-8 text-xs rounded-xl hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all'
						>
							<MinusSquare className='h-3.5 w-3.5 mr-1.5' />
							Clear
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={onSelectAll}
							className='h-8 text-xs rounded-xl hover:border-primary/50 transition-all'
						>
							<CheckSquare className='h-3.5 w-3.5 mr-1.5' />
							Select Top 3
						</Button>
					</div>
				</div>

				{/* Filter Pills */}
				<div className='flex gap-1.5 mt-2 flex-wrap pb-2'>
					<button
						onClick={() => handleCategoryChange('all')}
						className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 border ${
							activeCategory === 'all'
								? 'bg-primary border-primary text-primary-foreground shadow-sm'
								: 'bg-card border-border text-muted-foreground hover:border-primary/50'
						}`}
					>
						ALL
					</button>
					{Object.entries(sitemap.categorizedUrls).map(([cat, urls]) => {
						const count = urls.length;
						if (count === 0) return null;
						const color = getCategoryColor(cat);
						return (
							<button
								key={cat}
								onClick={() => handleCategoryChange(cat)}
								className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 border ${
									activeCategory === cat
										? 'bg-primary border-primary text-primary-foreground shadow-sm'
										: 'bg-card border-border text-muted-foreground hover:border-primary/50'
								}`}
							>
								<span
									className={`w-1.5 h-1.5 rounded-full ${color} ${activeCategory === cat ? 'bg-white' : ''}`}
								/>
								{cat.toUpperCase()}
								<span className={`ml-0.5 opacity-60 font-mono`}>{count}</span>
								{activeCategory === cat && (
									<button
										onClick={(e) => {
											e.stopPropagation();
											selectByCategory(cat);
										}}
										className='ml-1.5 p-0.5 bg-white/20 hover:bg-white/40 rounded transition-colors'
										title={`Select top 5 from ${cat}`}
									>
										<CheckSquare className='h-2.5 w-2.5' />
									</button>
								)}
							</button>
						);
					})}
				</div>

				{/* Search Input */}
				<div className='relative mt-1'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none' />
					<Input
						type='text'
						placeholder='Search URLs...'
						value={searchQuery}
						onChange={(e) => handleSearchChange(e.target.value)}
						className='pl-9 h-9 text-sm rounded-xl border-border bg-card'
					/>
				</div>
			</CardHeader>

			<CardContent className='px-0 space-y-4'>
				{/* URL List Container */}
				<div
					data-walkthrough='seo-sitemap-list'
					className='border border-border rounded-xl bg-card overflow-hidden'
				>
					{/* Pagination Info Bar */}
					<div className='flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/50 text-[11px] text-muted-foreground'>
						<span>
							Showing{' '}
							<span className='font-semibold text-foreground'>
								{filteredUrls.length === 0
									? 0
									: (currentPage - 1) * ITEMS_PER_PAGE + 1}
							</span>
							–
							<span className='font-semibold text-foreground'>
								{Math.min(currentPage * ITEMS_PER_PAGE, filteredUrls.length)}
							</span>{' '}
							of{' '}
							<span className='font-semibold text-foreground'>
								{filteredUrls.length}
							</span>{' '}
							URLs
						</span>
						{totalPages > 1 && (
							<div className='flex items-center gap-1.5'>
								<Button
									variant='ghost'
									size='sm'
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className='h-6 w-6 p-0 rounded-lg'
								>
									<ChevronLeft className='h-3.5 w-3.5' />
								</Button>
								<span className='font-mono text-[10px] min-w-[60px] text-center'>
									{currentPage} / {totalPages}
								</span>
								<Button
									variant='ghost'
									size='sm'
									onClick={() =>
										setCurrentPage((p) => Math.min(totalPages, p + 1))
									}
									disabled={currentPage === totalPages}
									className='h-6 w-6 p-0 rounded-lg'
								>
									<ChevronRight className='h-3.5 w-3.5' />
								</Button>
							</div>
						)}
					</div>

					<div className='max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-border/50'>
						{paginatedUrls.length > 0 ? (
							paginatedUrls.map((url) => {
								const isSelected = selectedUrls.includes(url);
								const category = getCategoryForUrl(url);

								return (
									<div
										key={url}
										className={`flex items-center gap-3 p-2.5 transition-colors group ${
											isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
										}`}
									>
										<button
											onClick={() => onToggleUrl(url)}
											className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded border transition-all ${
												isSelected
													? 'bg-primary border-primary text-primary-foreground'
													: 'bg-background border-border group-hover:border-primary/50'
											}`}
										>
											{isSelected && <Check className='h-3 w-3 stroke-[3]' />}
										</button>

										<div className='flex-1 min-w-0 flex flex-col gap-0.5'>
											<div className='flex items-center gap-2'>
												<a
													href={url}
													target='_blank'
													rel='noopener noreferrer'
													className='text-sm font-medium truncate text-foreground hover:text-primary transition-colors cursor-pointer'
												>
													{url.replace(/^https?:\/\//, '')}
												</a>
												<Badge
													variant='outline'
													className='h-4 px-1.5 text-[9px] font-bold uppercase tracking-tighter border-border/60'
												>
													{category}
												</Badge>
											</div>
										</div>

										<button
											onClick={() => toggleExpanded(url)}
											className='opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-md transition-all'
										>
											<Search className='h-3.5 w-3.5 text-muted-foreground' />
										</button>
									</div>
								);
							})
						) : (
							<div className='py-12 flex flex-col items-center justify-center text-muted-foreground italic text-sm'>
								{searchQuery
									? 'No URLs match your search.'
									: 'No URLs found in this category.'}
							</div>
						)}
					</div>

					{/* Bottom Pagination */}
					{totalPages > 1 && (
						<div className='flex items-center justify-center gap-1.5 px-3 py-2 bg-muted/30 border-t border-border/50'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setCurrentPage(1)}
								disabled={currentPage === 1}
								className='h-7 px-2 text-[10px] rounded-lg'
							>
								First
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className='h-7 w-7 p-0 rounded-lg'
							>
								<ChevronLeft className='h-3.5 w-3.5' />
							</Button>

							{/* Page number buttons */}
							{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
								let pageNum: number;
								if (totalPages <= 5) {
									pageNum = i + 1;
								} else if (currentPage <= 3) {
									pageNum = i + 1;
								} else if (currentPage >= totalPages - 2) {
									pageNum = totalPages - 4 + i;
								} else {
									pageNum = currentPage - 2 + i;
								}
								return (
									<Button
										key={pageNum}
										variant={currentPage === pageNum ? 'default' : 'outline'}
										size='sm'
										onClick={() => setCurrentPage(pageNum)}
										className='h-7 w-7 p-0 rounded-lg text-[10px] font-semibold'
									>
										{pageNum}
									</Button>
								);
							})}

							<Button
								variant='outline'
								size='sm'
								onClick={() =>
									setCurrentPage((p) => Math.min(totalPages, p + 1))
								}
								disabled={currentPage === totalPages}
								className='h-7 w-7 p-0 rounded-lg'
							>
								<ChevronRight className='h-3.5 w-3.5' />
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setCurrentPage(totalPages)}
								disabled={currentPage === totalPages}
								className='h-7 px-2 text-[10px] rounded-lg'
							>
								Last
							</Button>
						</div>
					)}
				</div>

				{/* Footer Action */}
				<div className='flex flex-col sm:flex-row items-center justify-between gap-4 pt-2'>
					<div className='flex items-center gap-2'>
						<div
							className={`p-2 rounded-lg ${selectedUrls.length > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
						>
							<FileText className='h-4 w-4' />
						</div>
						<p className='text-sm font-semibold tracking-tight'>
							{selectedUrls.length}{' '}
							<span className='text-muted-foreground font-normal'>
								/ 3 pages selected
							</span>
						</p>
					</div>

					<Button
						onClick={() => onAnalyze(selectedUrls)}
						disabled={
							selectedUrls.length === 0 ||
							selectedUrls.length > 3 ||
							isAnalyzing
						}
						className='w-full sm:w-auto rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all'
					>
						{isAnalyzing ? (
							<span className='flex items-center gap-2'>
								<span className='h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
								Analyzing...
							</span>
						) : (
							`Run Analysis`
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
