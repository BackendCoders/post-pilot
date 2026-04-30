'use client';

import { useState } from 'react';
import {
	X,
	AlertTriangle,
	Image as ImageIcon,
	Link as LinkIcon,
	ExternalLink,
	AlertCircle,
	Search,
	FileWarning,
	Activity,
	Zap,
} from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SeoDetailViewProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	details: any;
	type: 'images' | 'links' | 'performance';
}

export default function SeoDetailView({
	isOpen,
	onClose,
	title,
	details,
	type,
}: SeoDetailViewProps) {
	const [searchTerm, setSearchTerm] = useState('');

	if (!details) return null;

	const filterItems = (items: any[]) => {
		if (!searchTerm) return items;
		return items.filter((item) => {
			const searchStr = typeof item === 'string' ? item : item.src || item.href || item.url || '';
			return searchStr.toLowerCase().includes(searchTerm.toLowerCase());
		});
	};

	const formatSize = (bytes: number) => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border-none shadow-2xl'>
				<DialogHeader className='p-6 pb-4 bg-gradient-to-r from-primary/5 to-transparent border-b'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='p-2 rounded-xl bg-primary/10 text-primary'>
								{type === 'images' ? (
									<ImageIcon className='h-5 w-5' />
								) : type === 'links' ? (
									<LinkIcon className='h-5 w-5' />
								) : (
									<Zap className='h-5 w-5' />
								)}
							</div>
							<div>
								<DialogTitle className='text-xl font-bold tracking-tight'>
									{title}
								</DialogTitle>
								<DialogDescription className='text-sm text-muted-foreground'>
									Audit and resolve specific {type} issues found on this page.
								</DialogDescription>
							</div>
						</div>
					</div>
				</DialogHeader>

				<div className='p-4 border-b bg-muted/20'>
					<div className='relative'>
						<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
						<Input
							placeholder={`Search ${type === 'images' ? 'images' : type === 'links' ? 'links' : 'resources'}...`}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className='pl-9 bg-background border-border/60 focus-visible:ring-primary/20 rounded-xl'
						/>
					</div>
				</div>

				<div className='flex-1 overflow-y-auto p-0 custom-scrollbar'>
					{type === 'images' ? (
						<Tabs defaultValue='broken' className='w-full'>
							<div className='px-4 pt-2 sticky top-0 bg-background z-10 border-b pb-2'>
								<TabsList className='bg-muted/50 p-1 rounded-lg w-full flex overflow-x-auto h-auto no-scrollbar justify-start'>
									{[
										{ id: 'broken', label: 'Broken', count: details.brokenImages?.length, color: 'text-red-600' },
										{ id: 'missing', label: 'No Alt', count: details.missingAlt?.length, color: 'text-orange-600' },
										{ id: 'modern', label: 'Format', count: details.nonModernFormats?.length, color: 'text-blue-600' },
										{ id: 'size', label: 'Size', count: (details.heavyImages?.length || 0) + (details.criticalImages?.length || 0), color: 'text-amber-600' },
										{ id: 'duplicate', label: 'Duplicate', count: details.duplicateImages?.length, color: 'text-slate-600' },
									].map((tab) => (
										<TabsTrigger
											key={tab.id}
											value={tab.id}
											className='data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md py-1.5 px-3 text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap'
										>
											<span className={tab.color}>{tab.label}</span>
											<Badge variant='secondary' className='h-4 px-1 text-[9px] rounded-sm'>
												{tab.count || 0}
											</Badge>
										</TabsTrigger>
									))}
								</TabsList>
							</div>

							<div className='p-4'>
								<TabsContent value='broken' className='mt-0 space-y-2'>
									<ImageIssueList
										items={filterItems(details.brokenImages || [])}
										title='Broken Images'
										description='Images that failed to load or returned an error.'
										severity='high'
									/>
								</TabsContent>
								<TabsContent value='missing' className='mt-0 space-y-2'>
									<ImageIssueList
										items={filterItems(details.missingAlt || [])}
										title='Missing Alt Tags'
										description='Images without alt text are invisible to search engines and screen readers.'
										severity='high'
									/>
								</TabsContent>
								<TabsContent value='modern' className='mt-0 space-y-2'>
									<ImageIssueList
										items={filterItems(details.nonModernFormats || [])}
										title='Non-Modern Formats'
										description='Images not using WebP or AVIF formats may slow down page loading.'
										severity='medium'
										renderItem={(item) => (
											<div className='flex items-center gap-2 text-[10px] text-muted-foreground mt-1 font-medium'>
												<Badge variant='outline' className='h-4 px-1 text-[9px]'>
													{item.type}
												</Badge>
												<span>Consider converting to WebP/AVIF</span>
											</div>
										)}
									/>
								</TabsContent>
								<TabsContent value='size' className='mt-0 space-y-2'>
									<ImageIssueList
										items={filterItems([...(details.criticalImages || []), ...(details.heavyImages || [])])}
										title='Heavy Images'
										description='Large images significantly impact page speed and user experience.'
										severity='high'
										renderItem={(item) => (
											<div className='flex items-center gap-2 text-[10px] text-muted-foreground mt-1 font-medium'>
												<span className={item.size > 400000 ? 'text-red-600' : 'text-amber-600'}>
													{formatSize(item.size)}
												</span>
												<span>Recommended: &lt; 200 KB</span>
											</div>
										)}
									/>
								</TabsContent>
								<TabsContent value='duplicate' className='mt-0 space-y-2'>
									<ImageIssueList
										items={filterItems(details.duplicateImages || [])}
										title='Duplicate Image Assets'
										description='Multiple instances of the same image source can waste bandwidth.'
										severity='low'
									/>
								</TabsContent>
							</div>
						</Tabs>
					) : type === 'links' ? (
						<div className='p-4'>
							<LinkIssueList
								items={filterItems(details.invalidLinks || [])}
								title='Invalid Links'
								description='Links that point to invalid destinations like javascript:void(0) or empty URLs.'
							/>
						</div>
					) : (
						<Tabs defaultValue='blocking' className='w-full'>
							<div className='px-4 pt-2 sticky top-0 bg-background z-10 border-b pb-2'>
								<TabsList className='bg-muted/50 p-1 rounded-lg w-full flex overflow-x-auto h-auto no-scrollbar justify-start'>
									{[
										{ id: 'blocking', label: 'Render-Blocking', count: details.renderBlocking?.length, color: 'text-red-600' },
										{ id: 'large', label: 'Large Files', count: details.largeResources?.length, color: 'text-orange-600' },
										{ id: 'all', label: 'All Resources', count: details.allResources?.length, color: 'text-slate-600' },
									].map((tab) => (
										<TabsTrigger
											key={tab.id}
											value={tab.id}
											className='data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md py-1.5 px-3 text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap'
										>
											<span className={tab.color}>{tab.label}</span>
											<Badge variant='secondary' className='h-4 px-1 text-[9px] rounded-sm'>
												{tab.count || 0}
											</Badge>
										</TabsTrigger>
									))}
								</TabsList>
							</div>

							<div className='p-4'>
								<TabsContent value='blocking' className='mt-0 space-y-2'>
									<ResourceIssueList
										items={filterItems(details.renderBlocking || [])}
										title='Render-Blocking Resources'
										description='These files must be downloaded and parsed before the page can be displayed.'
										severity='high'
									/>
								</TabsContent>
								<TabsContent value='large' className='mt-0 space-y-2'>
									<ResourceIssueList
										items={filterItems(details.largeResources || [])}
										title='Large Resource Files'
										description='Large JS and CSS files increase load time. Consider code splitting or minification.'
										severity='medium'
										renderItem={(item) => (
											<div className='flex items-center gap-2 text-[10px] text-muted-foreground mt-1 font-medium'>
												<span className={item.size > 100000 ? 'text-red-600' : 'text-amber-600'}>
													{formatSize(item.size)}
												</span>
											</div>
										)}
									/>
								</TabsContent>
								<TabsContent value='all' className='mt-0 space-y-2'>
									<ResourceIssueList
										items={filterItems(details.allResources || [])}
										title='All Loaded Resources'
										description='Full list of scripts and stylesheets identified on this page.'
										severity='low'
									/>
								</TabsContent>
							</div>
						</Tabs>
					)}
				</div>

				<div className='p-4 border-t bg-muted/10 flex justify-end'>
					<Button onClick={onClose} variant='secondary' className='rounded-xl'>
						Close Details
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function ImageIssueList({
	items,
	title,
	description,
	severity,
	renderItem,
}: {
	items: any[];
	title: string;
	description: string;
	severity?: 'high' | 'medium' | 'low';
	renderItem?: (item: any) => React.ReactNode;
}) {
	if (items.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center py-12 text-center'>
				<div className='p-3 rounded-full bg-emerald-100 text-emerald-600 mb-3'>
					<CheckCircle className='h-6 w-6' />
				</div>
				<h5 className='text-sm font-semibold'>No issues found</h5>
				<p className='text-xs text-muted-foreground max-w-[200px] mt-1'>
					Great job! No images found in this category.
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			<div className='space-y-1'>
				<div className='flex items-center gap-2'>
					<h5 className='text-sm font-bold text-foreground'>{title}</h5>
					<Badge
						variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'warning' : 'secondary'}
						className='h-4 px-1 text-[9px] rounded-sm uppercase'
					>
						{severity || 'info'}
					</Badge>
				</div>
				<p className='text-xs text-muted-foreground'>{description}</p>
			</div>

			<div className='grid gap-2'>
				{items.map((item, i) => {
					const src = typeof item === 'string' ? item : item.src;
					return (
						<div
							key={i}
							className='group relative flex items-start gap-3 p-2 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all hover:shadow-sm'
						>
							<div className='shrink-0 w-12 h-12 rounded-lg bg-muted border border-border/40 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform'>
								{src ? (
									<img
										src={src}
										alt=''
										className='w-full h-full object-cover'
										onError={(e) => {
											(e.target as any).src = '';
											(e.target as any).className = 'hidden';
										}}
									/>
								) : (
									<ImageIcon className='h-5 w-5 text-muted-foreground/30' />
								)}
							</div>
							<div className='min-w-0 flex-1 py-0.5'>
								<div className='flex items-center justify-between gap-2'>
									<p className='text-xs font-mono text-muted-foreground truncate max-w-[400px]'>
										{src || 'Empty Source'}
									</p>
									<a
										href={src}
										target='_blank'
										rel='noopener noreferrer'
										className='p-1.5 rounded-lg hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity'
										title='Open Image'
									>
										<ExternalLink className='h-3 w-3' />
									</a>
								</div>
								{renderItem && renderItem(item)}
								{typeof item === 'object' && item.alt && (
									<div className='mt-1 flex items-center gap-1.5'>
										<Badge variant='outline' className='h-4 px-1 text-[9px] font-normal italic'>
											Alt: {item.alt}
										</Badge>
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function LinkIssueList({
	items,
	title,
	description,
}: {
	items: any[];
	title: string;
	description: string;
}) {
	if (items.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center py-12 text-center'>
				<div className='p-3 rounded-full bg-emerald-100 text-emerald-600 mb-3'>
					<CheckCircle className='h-6 w-6' />
				</div>
				<h5 className='text-sm font-semibold'>No invalid links</h5>
				<p className='text-xs text-muted-foreground max-w-[200px] mt-1'>
					All links on this page appear to be valid.
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			<div className='space-y-1'>
				<h5 className='text-sm font-bold text-foreground'>{title}</h5>
				<p className='text-xs text-muted-foreground'>{description}</p>
			</div>

			<div className='grid gap-2'>
				{items.map((url, i) => (
					<div
						key={i}
						className='flex items-center gap-3 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all group'
					>
						<div className='shrink-0 p-2 rounded-lg bg-red-100 text-red-600'>
							<LinkIcon className='h-4 w-4' />
						</div>
						<div className='min-w-0 flex-1'>
							<p className='text-xs font-mono text-muted-foreground truncate'>
								{url || 'Empty URL'}
							</p>
						</div>
						<Badge variant='destructive' className='h-4 px-1.5 text-[9px] uppercase'>
							Invalid
						</Badge>
					</div>
				))}
			</div>
		</div>
	);
}

function ResourceIssueList({
	items,
	title,
	description,
	severity,
	renderItem,
}: {
	items: any[];
	title: string;
	description: string;
	severity?: 'high' | 'medium' | 'low';
	renderItem?: (item: any) => React.ReactNode;
}) {
	if (items.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center py-12 text-center'>
				<div className='p-3 rounded-full bg-emerald-100 text-emerald-600 mb-3'>
					<CheckCircle className='h-6 w-6' />
				</div>
				<h5 className='text-sm font-semibold'>No resource issues</h5>
				<p className='text-xs text-muted-foreground max-w-[200px] mt-1'>
					Optimized! No resources flagged in this category.
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			<div className='space-y-1'>
				<div className='flex items-center gap-2'>
					<h5 className='text-sm font-bold text-foreground'>{title}</h5>
					{severity && (
						<Badge
							variant={severity === 'high' ? 'destructive' : 'outline'}
							className={`h-4 px-1 text-[9px] rounded-sm uppercase ${severity === 'medium' ? 'border-amber-500 text-amber-600' : ''}`}
						>
							{severity}
						</Badge>
					)}
				</div>
				<p className='text-xs text-muted-foreground'>{description}</p>
			</div>

			<div className='grid gap-2'>
				{items.map((item, i) => (
					<div
						key={i}
						className='group flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all'
					>
						<div className={`shrink-0 p-2 rounded-lg ${item.type === 'js' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
							{item.type === 'js' ? <Activity className='h-4 w-4' /> : <FileWarning className='h-4 w-4' />}
						</div>
						<div className='min-w-0 flex-1 py-0.5'>
							<div className='flex items-center justify-between gap-2'>
								<p className='text-xs font-mono text-muted-foreground truncate max-w-[450px]'>
									{item.url}
								</p>
								<a
									href={item.url}
									target='_blank'
									rel='noopener noreferrer'
									className='p-1 rounded-lg hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity'
								>
									<ExternalLink className='h-3 w-3' />
								</a>
							</div>
							<div className='mt-1.5 flex items-center gap-2'>
								<Badge variant='outline' className='h-4 px-1.5 text-[9px] font-bold uppercase'>
									{item.type}
								</Badge>
								{item.isBlocking && (
									<Badge variant='destructive' className='h-4 px-1.5 text-[9px] font-bold uppercase'>
										Render-Blocking
									</Badge>
								)}
								{renderItem && renderItem(item)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function CheckCircle({ className }: { className?: string }) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			width='24'
			height='24'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			className={className}
		>
			<path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
			<polyline points='22 4 12 14.01 9 11.01' />
		</svg>
	);
}
