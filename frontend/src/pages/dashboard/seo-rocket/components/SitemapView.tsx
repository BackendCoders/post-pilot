'use client';

import { useState, useMemo } from 'react';
import {
	Check,
	FileText,
	ShoppingCart,
	BookOpen,
	Layers,
	File,
	Globe,
	CheckSquare,
	MinusSquare,
	Search,
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
import type { SitePageCountResult, CategorizedUrls } from '@/types/seo.types';

interface SitemapViewProps {
	sitemap: SitePageCountResult;
	selectedUrls: string[];
	onToggleUrl: (url: string) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onAnalyze: (urls: string[]) => void;
	isAnalyzing: boolean;
}

type CategoryKey = keyof CategorizedUrls;

const categoryConfig: {
	key: CategoryKey;
	label: string;
	icon: React.ReactNode;
	color: string;
}[] = [
	{
		key: 'blog',
		label: 'Blog',
		icon: <BookOpen className='h-3 w-3' />,
		color: 'bg-blue-500',
	},
	{
		key: 'product',
		label: 'Products',
		icon: <ShoppingCart className='h-3 w-3' />,
		color: 'bg-green-500',
	},
	{
		key: 'category',
		label: 'Categories',
		icon: <Layers className='h-3 w-3' />,
		color: 'bg-purple-500',
	},
	{
		key: 'post',
		label: 'Posts',
		icon: <FileText className='h-3 w-3' />,
		color: 'bg-orange-500',
	},
	{
		key: 'pages',
		label: 'Pages',
		icon: <File className='h-3 w-3' />,
		color: 'bg-zinc-500',
	},
	{
		key: 'other',
		label: 'Other',
		icon: <Globe className='h-3 w-3' />,
		color: 'bg-slate-400',
	},
];

export default function SitemapView({
	sitemap,
	selectedUrls,
	onToggleUrl,
	onSelectAll,
	onDeselectAll,
	onAnalyze,
	isAnalyzing,
}: SitemapViewProps) {
	const [activeCategory, setActiveCategory] = useState<CategoryKey | 'all'>(
		'all',
	);
	const [_expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());

	const filteredUrls = useMemo(() => {
		if (activeCategory === 'all') return sitemap.urls;
		return sitemap.categorizedUrls[activeCategory];
	}, [sitemap, activeCategory]);

	const toggleExpanded = (url: string) => {
		setExpandedUrls((prev) => {
			const next = new Set(prev);
			if (next.has(url)) next.delete(url);
			else next.add(url);
			return next;
		});
	};

	const getCategoryForUrl = (url: string): CategoryKey => {
		for (const cat of categoryConfig) {
			if (sitemap.categorizedUrls[cat.key].includes(url)) return cat.key;
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
							Select All
						</Button>
					</div>
				</div>

				{/* Filter Pills */}
				<div className='flex gap-1.5 mt-2 flex-wrap pb-2'>
					<button
						onClick={() => setActiveCategory('all')}
						className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 border ${
							activeCategory === 'all'
								? 'bg-primary border-primary text-primary-foreground shadow-sm'
								: 'bg-card border-border text-muted-foreground hover:border-primary/50'
						}`}
					>
						ALL
					</button>
					{categoryConfig.map((cat) => {
						const count = sitemap.categorizedUrls[cat.key].length;
						if (count === 0) return null;
						return (
							<button
								key={cat.key}
								onClick={() => setActiveCategory(cat.key)}
								className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 border ${
									activeCategory === cat.key
										? 'bg-primary border-primary text-primary-foreground shadow-sm'
										: 'bg-card border-border text-muted-foreground hover:border-primary/50'
								}`}
							>
								<span
									className={`w-1.5 h-1.5 rounded-full ${cat.color} ${activeCategory === cat.key ? 'bg-white' : ''}`}
								/>
								{cat.label.toUpperCase()}
								<span className={`ml-0.5 opacity-60 font-mono`}>{count}</span>
							</button>
						);
					})}
				</div>
			</CardHeader>

			<CardContent className='px-0 space-y-4'>
				{/* URL List Container */}
				<div className='border border-border rounded-xl bg-card overflow-hidden'>
					<div className='max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-border/50'>
						{filteredUrls.length > 0 ? (
							filteredUrls.map((url) => {
								const isSelected = selectedUrls.includes(url);
								const category = getCategoryForUrl(url);
								const catConfig = categoryConfig.find(
									(c) => c.key === category,
								);

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
													{catConfig?.label}
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
								No URLs found in this category.
							</div>
						)}
					</div>
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
								pages ready for analysis
							</span>
						</p>
					</div>

					<Button
						onClick={() => onAnalyze(selectedUrls)}
						disabled={selectedUrls.length === 0 || isAnalyzing}
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
