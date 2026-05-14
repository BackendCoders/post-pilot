'use client';

import { useState } from 'react';
import {
	Image as ImageIcon,
	Link as LinkIcon,
	ExternalLink,
	Search,
	FileWarning,
	Activity,
	Zap,
	ChevronDown,
	ChevronRight,
	Languages,
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
	type:
		| 'meta'
		| 'headings'
		| 'content'
		| 'technical'
		| 'images'
		| 'links'
		| 'performance';
	issues?: any[];
}

export default function SeoDetailView({
	isOpen,
	onClose,
	title,
	details,
	type,
	issues = [],
}: SeoDetailViewProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [openHeadings, setOpenHeadings] = useState<Record<string, boolean>>({
		h1: true,
	});

	if (!details) return null;

	const filterItems = (items: any[]) => {
		if (!searchTerm) return items;
		return items.filter((item) => {
			const searchStr =
				typeof item === 'string'
					? item
					: item.src || item.href || item.url || '';
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
		<Dialog
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}
		>
			<DialogContent className='max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border-none shadow-2xl'>
				<DialogHeader className='p-6 pb-4 bg-linear-to-r from-primary/5 to-transparent border-b'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='p-2 rounded-xl bg-primary/10 text-primary'>
								{type === 'images' ? (
									<ImageIcon className='h-5 w-5' />
								) : type === 'links' ? (
									<LinkIcon className='h-5 w-5' />
								) : type === 'performance' ? (
									<Zap className='h-5 w-5' />
								) : (
									<Activity className='h-5 w-5' />
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

				{['images', 'links', 'performance'].includes(type) && (
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
				)}

				<div className='flex-1 overflow-y-auto p-0 custom-scrollbar'>
					{/* Specialized Views */}
					{type === 'images' ? (
						<Tabs
							defaultValue='broken'
							className='w-full'
						>
							<div className='px-4 pt-2 sticky top-0 bg-background z-10 border-b pb-2'>
								<TabsList className='bg-muted/50 p-1 rounded-lg w-full flex overflow-x-auto h-auto no-scrollbar justify-start'>
									{[
										{
											id: 'broken',
											label: 'Broken',
											count: details.brokenImages?.length,
											color: 'text-red-600',
										},
										{
											id: 'missing',
											label: 'No Alt',
											count: details.missingAlt?.length,
											color: 'text-orange-600',
										},
										{
											id: 'lazy',
											label: 'No Lazy Load',
											count: details.missingLazyLoad?.length,
											color: 'text-amber-600',
										},
										{
											id: 'modern',
											label: 'Format',
											count: details.nonModernFormats?.length,
											color: 'text-blue-600',
										},
										{
											id: 'size',
											label: 'Size',
											count:
												(details.heavyImages?.length || 0) +
												(details.criticalImages?.length || 0),
											color: 'text-amber-600',
										},
										{
											id: 'duplicate',
											label: 'Duplicate',
											count: details.duplicateImages?.length,
											color: 'text-slate-600',
										},
									].map((tab) => (
										<TabsTrigger
											key={tab.id}
											value={tab.id}
											className='data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md py-1.5 px-3 text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap'
										>
											<span className={tab.color}>{tab.label}</span>
											<Badge
												variant='secondary'
												className='h-4 px-1 text-[9px] rounded-sm'
											>
												{tab.count || 0}
											</Badge>
										</TabsTrigger>
									))}
								</TabsList>
							</div>

							<div className='p-4'>
								<TabsContent
									value='broken'
									className='mt-0 space-y-2'
								>
									<ImageIssueList
										items={filterItems(details.brokenImages || [])}
										title='Broken Images'
										description='Images that failed to load or returned an error.'
										severity='high'
									/>
								</TabsContent>
								<TabsContent
									value='missing'
									className='mt-0 space-y-2'
								>
									<ImageIssueList
										items={filterItems(details.missingAlt || [])}
										title='Missing Alt Tags'
										description='Images without alt text are invisible to search engines and screen readers.'
										severity='high'
									/>
								</TabsContent>
								<TabsContent
									value='lazy'
									className='mt-0 space-y-2'
								>
									<ImageIssueList
										items={filterItems(details.missingLazyLoad || [])}
										title='Missing Lazy Loading'
										description='Below-the-fold images should have loading="lazy" to improve page performance.'
										severity='medium'
									/>
								</TabsContent>
								<TabsContent
									value='modern'
									className='mt-0 space-y-2'
								>
									<ImageIssueList
										items={filterItems(details.nonModernFormats || [])}
										title='Non-Modern Formats'
										description='Images not using WebP or AVIF formats may slow down page loading.'
										severity='medium'
										renderItem={(item) => (
											<div className='flex items-center gap-2 text-[10px] text-muted-foreground mt-1 font-medium'>
												<Badge
													variant='outline'
													className='h-4 px-1 text-[9px]'
												>
													{item.type}
												</Badge>
												<span>Consider converting to WebP/AVIF</span>
											</div>
										)}
									/>
								</TabsContent>
								<TabsContent
									value='size'
									className='mt-0 space-y-2'
								>
									<ImageIssueList
										items={filterItems([
											...(details.criticalImages || []),
											...(details.heavyImages || []),
										])}
										title='Heavy Images'
										description='Large images significantly impact page speed and user experience.'
										severity='high'
										renderItem={(item) => (
											<div className='flex items-center gap-2 text-[10px] text-muted-foreground mt-1 font-medium'>
												<span
													className={
														item.size > 400000
															? 'text-red-600'
															: 'text-amber-600'
													}
												>
													{formatSize(item.size)}
												</span>
												<span>Recommended: &lt; 200 KB</span>
											</div>
										)}
									/>
								</TabsContent>
								<TabsContent
									value='duplicate'
									className='mt-0 space-y-2'
								>
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
						<Tabs
							defaultValue='broken'
							className='w-full'
						>
							<div className='px-4 pt-2 sticky top-0 bg-background z-10 border-b pb-2'>
								<TabsList className='bg-muted/50 p-1 rounded-lg w-full flex overflow-x-auto h-auto no-scrollbar justify-start'>
									{[
										{
											id: 'broken',
											label: 'Broken (404)',
											count: details.brokenLinks?.length,
											color: 'text-red-600',
										},
										{
											id: 'nofollow',
											label: 'No Nofollow',
											count: details.externalNoNofollow?.length,
											color: 'text-orange-600',
										},
										{
											id: 'anchor',
											label: 'Anchor Issues',
											count: details.nonDescriptiveLinks?.length,
											color: 'text-amber-600',
										},
										{
											id: 'internal',
											label: 'Internal',
											count: details.internalLinks?.length,
											color: 'text-blue-600',
										},
										{
											id: 'external',
											label: 'External',
											count: details.externalLinks?.length,
											color: 'text-purple-600',
										},
										{
											id: 'all',
											label: 'All Links',
											count: details.allLinks?.length,
											color: 'text-slate-600',
										},
									].map((tab) => (
										<TabsTrigger
											key={tab.id}
											value={tab.id}
											className='data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md py-1.5 px-3 text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap'
										>
											<span className={tab.color}>{tab.label}</span>
											<Badge
												variant='secondary'
												className='h-4 px-1 text-[9px] rounded-sm'
											>
												{tab.count || 0}
											</Badge>
										</TabsTrigger>
									))}
								</TabsList>
							</div>

							<div className='p-4 space-y-2'>
								<TabsContent
									value='broken'
									className='mt-0 space-y-1.5'
								>
									<p className='text-[10px] font-bold text-muted-foreground uppercase mb-2'>
										Broken Internal Links (404)
									</p>
									<p className='text-xs text-muted-foreground mb-3'>
										Internal links that returned a 404. Fix or remove these URLs
										to avoid crawl waste.
									</p>
									{filterItems(details.brokenLinks || []).length === 0 ? (
										<p className='text-xs text-emerald-600 font-medium'>
											✓ No broken links found
										</p>
									) : (
										filterItems(details.brokenLinks || []).map(
											(link: any, i: number) => (
												<div
													key={i}
													className='flex items-start gap-2 p-2 rounded-lg border border-red-200 bg-red-50/50'
												>
													<span className='text-red-500 mt-0.5 shrink-0 text-xs'>
														✕
													</span>
													<div className='min-w-0'>
														<p className='text-xs font-medium break-all'>
															{link.href}
														</p>
														{link.text && (
															<p className='text-[10px] text-muted-foreground mt-0.5'>
																Anchor: "{link.text}"
															</p>
														)}
													</div>
												</div>
											),
										)
									)}
								</TabsContent>
								<TabsContent
									value='nofollow'
									className='mt-0 space-y-1.5'
								>
									<p className='text-[10px] font-bold text-muted-foreground uppercase mb-2'>
										External Links Missing rel="nofollow"
									</p>
									<p className='text-xs text-muted-foreground mb-3'>
										Add rel="nofollow" to untrusted or paid external links.
									</p>
									{filterItems(details.externalNoNofollow || []).length ===
									0 ? (
										<p className='text-xs text-emerald-600 font-medium'>
											✓ All external links have proper rel attributes
										</p>
									) : (
										filterItems(details.externalNoNofollow || []).map(
											(link: any, i: number) => (
												<div
													key={i}
													className='flex items-start gap-2 p-2 rounded-lg border border-orange-200 bg-orange-50/50'
												>
													<span className='text-orange-500 mt-0.5 shrink-0 text-xs'>
														⚠
													</span>
													<div className='min-w-0'>
														<p className='text-xs font-medium break-all'>
															{link.href}
														</p>
														{link.text && (
															<p className='text-[10px] text-muted-foreground mt-0.5'>
																Anchor: "{link.text}"
															</p>
														)}
													</div>
												</div>
											),
										)
									)}
								</TabsContent>
								<TabsContent
									value='anchor'
									className='mt-0 space-y-1.5'
								>
									<p className='text-[10px] font-bold text-muted-foreground uppercase mb-2'>
										Non-Descriptive Anchor Text
									</p>
									<p className='text-xs text-muted-foreground mb-3'>
										Replace generic text like "click here" with keyword-rich
										phrases.
									</p>
									{filterItems(details.nonDescriptiveLinks || []).length ===
									0 ? (
										<p className='text-xs text-emerald-600 font-medium'>
											✓ All internal links have descriptive anchor text
										</p>
									) : (
										filterItems(details.nonDescriptiveLinks || []).map(
											(link: any, i: number) => (
												<div
													key={i}
													className='flex items-start gap-2 p-2 rounded-lg border border-amber-200 bg-amber-50/50'
												>
													<span className='text-amber-500 mt-0.5 shrink-0 text-xs'>
														⚠
													</span>
													<div className='min-w-0'>
														<p className='text-xs font-medium break-all'>
															{link.href}
														</p>
														<p className='text-[10px] text-muted-foreground mt-0.5'>
															Anchor: "{'{'}link.text || '(empty)'{'}'}"
														</p>
													</div>
												</div>
											),
										)
									)}
								</TabsContent>
								<TabsContent
									value='internal'
									className='mt-0 space-y-1.5'
								>
									<p className='text-[10px] font-bold text-muted-foreground uppercase mb-2'>
										Internal Links
									</p>
									{filterItems(details.internalLinks || []).map(
										(link: any, i: number) => (
											<div
												key={i}
												className='flex items-start gap-2 p-2 rounded-lg border border-border/40 bg-muted/10'
											>
												<div className='min-w-0 flex-1'>
													<p className='text-xs font-medium break-all'>
														{link.href}
													</p>
													{link.text && (
														<p className='text-[10px] text-muted-foreground mt-0.5'>
															"{link.text}"
														</p>
													)}
												</div>
												{link.isBroken && (
													<Badge
														variant='destructive'
														className='text-[9px] h-4 shrink-0'
													>
														404
													</Badge>
												)}
											</div>
										),
									)}
									{filterItems(details.internalLinks || []).length === 0 && (
										<p className='text-xs text-muted-foreground'>
											No internal links found.
										</p>
									)}
								</TabsContent>
								<TabsContent
									value='external'
									className='mt-0 space-y-1.5'
								>
									<p className='text-[10px] font-bold text-muted-foreground uppercase mb-2'>
										External Links
									</p>
									{filterItems(details.externalLinks || []).map(
										(link: any, i: number) => (
											<div
												key={i}
												className='flex items-start gap-2 p-2 rounded-lg border border-border/40 bg-muted/10'
											>
												<div className='min-w-0 flex-1'>
													<p className='text-xs font-medium break-all'>
														{link.href}
													</p>
													{link.text && (
														<p className='text-[10px] text-muted-foreground mt-0.5'>
															"{link.text}"
														</p>
													)}
												</div>
												{link.rel && (
													<Badge
														variant='outline'
														className='text-[9px] h-4 shrink-0'
													>
														{link.rel}
													</Badge>
												)}
											</div>
										),
									)}
									{filterItems(details.externalLinks || []).length === 0 && (
										<p className='text-xs text-muted-foreground'>
											No external links found.
										</p>
									)}
								</TabsContent>
								<TabsContent
									value='all'
									className='mt-0 space-y-1.5'
								>
									<p className='text-[10px] font-bold text-muted-foreground uppercase mb-2'>
										All Discovered Links
									</p>
									{filterItems(details.allLinks || []).map(
										(link: any, i: number) => (
											<div
												key={i}
												className='flex items-start gap-2 p-2 rounded-lg border border-border/40 bg-muted/10'
											>
												<div className='min-w-0 flex-1'>
													<p className='text-xs font-medium break-all'>
														{link.href}
													</p>
													{link.text && (
														<p className='text-[10px] text-muted-foreground mt-0.5'>
															"{link.text}"
														</p>
													)}
												</div>
												<div className='flex gap-1 shrink-0'>
													<Badge
														variant='outline'
														className={`text-[9px] h-4 ${link.isInternal ? 'text-blue-600' : 'text-purple-600'}`}
													>
														{link.isInternal ? 'int' : 'ext'}
													</Badge>
													{link.isBroken && (
														<Badge
															variant='destructive'
															className='text-[9px] h-4'
														>
															404
														</Badge>
													)}
												</div>
											</div>
										),
									)}
									{filterItems(details.allLinks || []).length === 0 && (
										<p className='text-xs text-muted-foreground'>
											No links found.
										</p>
									)}
								</TabsContent>
							</div>
						</Tabs>
					) : type === 'performance' ? (
						<Tabs
							defaultValue='blocking'
							className='w-full'
						>
							<div className='px-4 pt-2 sticky top-0 bg-background z-10 border-b pb-2'>
								<TabsList className='bg-muted/50 p-1 rounded-lg w-full flex overflow-x-auto h-auto no-scrollbar justify-start'>
									{[
										{
											id: 'blocking',
											label: 'Render-Blocking',
											count: details.renderBlocking?.length,
											color: 'text-red-600',
										},
										{
											id: 'large',
											label: 'Large Files',
											count: details.largeResources?.length,
											color: 'text-orange-600',
										},
										{
											id: 'all',
											label: 'All Resources',
											count: details.allResources?.length,
											color: 'text-slate-600',
										},
									].map((tab) => (
										<TabsTrigger
											key={tab.id}
											value={tab.id}
											className='data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md py-1.5 px-3 text-xs font-medium flex items-center gap-2 whitespace-nowrap'
										>
											<span className={tab.color}>{tab.label}</span>
											<Badge
												variant='secondary'
												className='h-4 px-1 text-[9px] rounded-sm'
											>
												{tab.count || 0}
											</Badge>
										</TabsTrigger>
									))}
								</TabsList>
							</div>

							<div className='p-4'>
								<TabsContent
									value='blocking'
									className='mt-0 space-y-2'
								>
									<ResourceIssueList
										items={filterItems(details.renderBlocking || [])}
										title='Render-Blocking Resources'
										description='These files must be downloaded and parsed before the page can be displayed.'
										severity='high'
									/>
								</TabsContent>
								<TabsContent
									value='large'
									className='mt-0 space-y-2'
								>
									<ResourceIssueList
										items={filterItems(details.largeResources || [])}
										title='Large Resource Files'
										description='Large JS and CSS files increase load time. Consider code splitting or minification.'
										severity='medium'
										renderItem={(item) => (
											<div className='flex items-center gap-2 text-[10px] text-muted-foreground mt-1 font-medium'>
												<span
													className={
														item.size > 100000
															? 'text-red-600'
															: 'text-amber-600'
													}
												>
													{formatSize(item.size)}
												</span>
											</div>
										)}
									/>
								</TabsContent>
								<TabsContent
									value='all'
									className='mt-0 space-y-2'
								>
									<ResourceIssueList
										items={filterItems(details.allResources || [])}
										title='All Loaded Resources'
										description='Full list of scripts and stylesheets identified on this page.'
										severity='low'
									/>
								</TabsContent>
							</div>
						</Tabs>
					) : (
						/* Generic Audit View for Meta, Headings, Content, Technical */
						<div className='p-6'>
							<div className='grid gap-8'>
								{/* Section Context / Content Preview (TOP) */}
								<div className='space-y-4'>
									<div className='flex items-center gap-2 mb-2'>
										<div className='p-1.5 rounded-lg bg-primary/5 text-primary'>
											<Activity className='h-4 w-4' />
										</div>
										<h5 className='text-sm font-bold text-foreground'>
											Page Content Preview
										</h5>
									</div>

									<div className='rounded-2xl border border-border/40 bg-muted/5 p-5'>
										{type === 'meta' ? (
											<div className='space-y-6'>
												<div className='space-y-2'>
													<span className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest block'>
														Google Search Preview
													</span>
													<div className='bg-white p-4 rounded-xl border border-border/40 shadow-sm max-w-lg'>
														<div className='text-[#1a0dab] text-xl font-medium hover:underline cursor-pointer truncate'>
															{details.title || 'No title tag found'}
														</div>
														<div className='text-[#006621] text-sm mt-0.5 truncate'>
															{details.url || 'https://example.com/page'}
														</div>
														<div className='text-[#4d5156] text-sm mt-1 line-clamp-2 leading-relaxed'>
															{details.metaDescription ||
																'No meta description found. Add one to improve search appearance.'}
														</div>
													</div>
												</div>
												<div className='grid grid-cols-1 gap-4'>
													<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
														<div className='p-3 rounded-xl bg-background border border-border/40'>
															<span className='text-[10px] font-bold text-muted-foreground uppercase block mb-1.5'>
																Meta Title
															</span>
															<p className='text-xs font-medium break-words'>
																{details.title || 'None'}
															</p>
															<span className='text-[9px] text-muted-foreground mt-1 block'>
																{details.title?.length || 0} characters
															</span>
														</div>
														<div className='p-3 rounded-xl bg-background border border-border/40 md:col-span-2'>
															<span className='text-[10px] font-bold text-muted-foreground uppercase block mb-1.5'>
																Meta Description
															</span>
															<p className='text-xs font-medium leading-relaxed break-words'>
																{details.metaDescription || 'None'}
															</p>
															<span className='text-[9px] text-muted-foreground mt-1 block'>
																{details.metaDescription?.length || 0}{' '}
																characters
															</span>
														</div>
													</div>
													<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
														<div className='p-3 rounded-xl bg-background border border-border/40'>
															<span className='text-[10px] font-bold text-muted-foreground uppercase block mb-1.5'>
																Keywords
															</span>
															<div className='flex flex-wrap gap-1'>
																{details.metaKeywords ? (
																	details.metaKeywords
																		.split(',')
																		.map((k: string, idx: number) => (
																			<Badge
																				key={idx}
																				variant='outline'
																				className='text-[9px] font-medium py-0 h-4 bg-muted/30'
																			>
																				{k.trim()}
																			</Badge>
																		))
																) : (
																	<span className='text-xs text-muted-foreground italic'>
																		None found
																	</span>
																)}
															</div>
														</div>
														<div className='p-3 rounded-xl bg-background border border-border/40'>
															<span className='text-[10px] font-bold text-muted-foreground uppercase block mb-1.5'>
																Viewport & Robots
															</span>
															<div className='flex flex-col gap-1'>
																<div className='flex items-center justify-between text-[10px]'>
																	<span className='text-muted-foreground'>
																		Viewport:
																	</span>
																	<span className='font-mono font-bold'>
																		{details.viewport || 'Not set'}
																	</span>
																</div>
																<div className='flex items-center justify-between text-[10px]'>
																	<span className='text-muted-foreground'>
																		Robots:
																	</span>
																	<span className='font-mono font-bold'>
																		{details.robotsMeta || 'Default'}
																	</span>
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
										) : type === 'headings' ? (
											<div className='space-y-3'>
												<span className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1'>
													Heading Structure (H1-H6)
												</span>
												<div className='space-y-2'>
													{['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((hType) => {
														const hItems = Array.isArray(details.headings)
															? details.headings.filter(
																	(h: any) => h.type === hType,
																)
															: [];
														const isOpen = openHeadings[hType];

														return (
															<div
																key={hType}
																className='border border-border/40 rounded-xl overflow-hidden bg-background'
															>
																<button
																	onClick={() =>
																		setOpenHeadings((prev) => ({
																			...prev,
																			[hType]: !prev[hType],
																		}))
																	}
																	className={`w-full flex items-center justify-between p-3 transition-colors hover:bg-muted/30 ${isOpen ? 'bg-muted/20 border-b border-border/40' : ''}`}
																>
																	<div className='flex items-center gap-3'>
																		<Badge
																			variant='secondary'
																			className={`h-6 w-10 flex items-center justify-center font-bold ${
																				hType === 'h1'
																					? 'bg-primary text-primary-foreground'
																					: hType === 'h2'
																						? 'bg-blue-100 text-blue-700'
																						: 'bg-muted text-muted-foreground'
																			}`}
																		>
																			{hType.toUpperCase()}
																		</Badge>
																		<span className='text-xs font-bold text-foreground'>
																			{hItems.length}{' '}
																			{hItems.length === 1
																				? 'Heading'
																				: 'Headings'}{' '}
																			found
																		</span>
																	</div>
																	{isOpen ? (
																		<ChevronDown className='h-4 w-4 text-muted-foreground' />
																	) : (
																		<ChevronRight className='h-4 w-4 text-muted-foreground' />
																	)}
																</button>

																{isOpen && (
																	<div className='p-3 space-y-2 bg-muted/5'>
																		{hItems.length > 0 ? (
																			hItems.map((h: any, idx: number) => (
																				<div
																					key={idx}
																					className='text-xs leading-relaxed p-2 rounded-lg bg-background border border-border/40 font-medium'
																				>
																					{h.text}
																				</div>
																			))
																		) : (
																			<p className='text-[10px] text-muted-foreground italic py-1 px-1'>
																				No {hType.toUpperCase()} headings found.
																			</p>
																		)}
																	</div>
																)}
															</div>
														);
													})}
												</div>
											</div>
										) : type === 'content' ? (
											<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
												<div className='p-4 rounded-xl bg-background border border-border/40 text-center'>
													<span className='text-[10px] font-bold text-muted-foreground uppercase block mb-2'>
														Word Count
													</span>
													<span className='text-3xl font-bold text-primary'>
														{details.wordCount || 0}
													</span>
													<p className='text-[10px] text-muted-foreground mt-1'>
														Estimated words
													</p>
												</div>
												<div className='p-4 rounded-xl bg-background border border-border/40 md:col-span-2'>
													<span className='text-[10px] font-bold text-muted-foreground uppercase block mb-2'>
														Keyword Signals
													</span>
													<div className='space-y-2'>
														{details.stuffing && details.stuffing.length > 0 ? (
															details.stuffing.map((k: any, idx: number) => (
																<div
																	key={idx}
																	className='flex items-center justify-between text-xs'
																>
																	<span className='font-medium'>{k.word}</span>
																	<Badge
																		variant='secondary'
																		className='h-5 px-1.5'
																	>
																		{k.count} times
																	</Badge>
																</div>
															))
														) : (
															<p className='text-xs text-muted-foreground italic'>
																No keyword stuffing issues found.
															</p>
														)}
													</div>
												</div>
											</div>
										) : type === 'technical' ? (
											<div className='space-y-6'>
												<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
													<div className='p-4 rounded-xl bg-background border border-border/40'>
														<span className='text-[10px] font-bold text-muted-foreground uppercase block mb-1'>
															Canonical URL
														</span>
														<span className='text-xs font-mono break-all'>
															{details.canonical || 'Not defined'}
														</span>
														{details.isCanonicalValid !== undefined && (
															<Badge
																variant={
																	details.isCanonicalValid
																		? 'outline'
																		: 'destructive'
																}
																className='mt-2 h-4 text-[8px]'
															>
																{details.isCanonicalValid
																	? 'MATCHES URL'
																	: 'MISMATCH'}
															</Badge>
														)}
													</div>
													<div className='p-4 rounded-xl bg-background border border-border/40'>
														<span className='text-[10px] font-bold text-muted-foreground uppercase block mb-1'>
															Security & Access
														</span>
														<div className='flex flex-wrap gap-2 mt-2'>
															<Badge
																variant={
																	details.https ? 'outline' : 'destructive'
																}
																className='h-5 gap-1'
															>
																<Zap className='h-3 w-3' /> HTTPS:{' '}
																{details.https ? 'YES' : 'NO'}
															</Badge>
															<Badge
																variant={
																	details.robotstxt ? 'outline' : 'destructive'
																}
																className='h-5 gap-1'
															>
																<Activity className='h-3 w-3' /> Robots.txt:{' '}
																{details.robotstxt ? 'YES' : 'NO'}
															</Badge>
														</div>
													</div>
												</div>
												{details.redirects && details.redirects.length > 0 && (
													<div className='p-4 rounded-xl bg-background border border-border/40'>
														<span className='text-[10px] font-bold text-muted-foreground uppercase block mb-2'>
															Redirect Chain ({details.redirectCount})
														</span>
														<div className='space-y-2'>
															{details.redirects.map(
																(r: string, idx: number) => (
																	<div
																		key={idx}
																		className='flex items-center gap-2 text-xs'
																	>
																		<Badge
																			variant='secondary'
																			className='h-4 w-4 p-0 flex items-center justify-center shrink-0'
																		>
																			{idx + 1}
																		</Badge>
																		<span className='font-mono text-muted-foreground truncate'>
																			{r}
																		</span>
																	</div>
																),
															)}
														</div>
													</div>
												)}

												<div className='p-4 rounded-xl bg-background border border-border/40'>
													<div className='flex items-center justify-between mb-2'>
														<span className='text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5'>
															<Languages className='h-3 w-3' /> Language Tag
														</span>
														{details.language ? (
															<Badge
																variant='outline'
																className='h-4 text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 uppercase'
															>
																{details.language}
															</Badge>
														) : (
															<Badge
																variant='destructive'
																className='h-4 text-[9px] uppercase'
															>
																Missing
															</Badge>
														)}
													</div>
													<p className='text-xs text-foreground/80 font-medium'>
														{details.language
															? `The document language is correctly set to "${details.language}".`
															: 'The document language attribute is missing from the <html> tag.'}
													</p>
													<span className='text-[10px] text-muted-foreground mt-2 block leading-tight'>
														{details.language
															? 'This helps search engines and screen readers understand your content.'
															: 'Add <html lang="en"> to improve accessibility and SEO.'}
													</span>
												</div>

												{/* Favicon Card */}
												<div className='p-4 rounded-xl bg-background border border-border/40'>
													<div className='flex items-center justify-between mb-2'>
														<span className='text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5'>
															<ImageIcon className='h-3 w-3' /> Favicon
														</span>
														{details.favicon ? (
															<Badge
																variant='outline'
																className='h-4 text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 uppercase'
															>
																Present
															</Badge>
														) : (
															<Badge
																variant='destructive'
																className='h-4 text-[9px] uppercase'
															>
																Missing
															</Badge>
														)}
													</div>
													<p className='text-xs text-foreground/80 font-medium'>
														{details.favicon
															? `A favicon or manifest is correctly linked: ${details.favicon.substring(0, 30)}${details.favicon.length > 30 ? '...' : ''}`
															: 'The favicon attribute is missing from the <head> tag.'}
													</p>
													<span className='text-[10px] text-muted-foreground mt-2 block leading-tight'>
														{details.favicon
															? 'This improves brand visibility in browser tabs and search results.'
															: 'Add <link rel="icon" href="/favicon.ico"> to improve brand visibility.'}
													</span>
												</div>
											</div>
										) : (
											<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
												{Object.entries(details).map(
													([key, value]: [string, any]) => {
														if (typeof value === 'object' && value !== null)
															return null;
														return (
															<div
																key={key}
																className='p-3 rounded-lg border border-border/40 bg-background'
															>
																<span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1'>
																	{key.replace(/([A-Z])/g, ' $1').trim()}
																</span>
																<span className='text-xs font-medium break-all'>
																	{value?.toString() || 'None'}
																</span>
															</div>
														);
													},
												)}
											</div>
										)}
									</div>
								</div>

								{/* Audit / Issues Section (BOTTOM) */}
								<div className='space-y-4 pt-4 border-t'>
									<div className='flex items-center gap-2'>
										<div className='p-1.5 rounded-lg bg-red-50 text-red-600'>
											<Activity className='h-4 w-4' />
										</div>
										<h5 className='text-sm font-bold text-foreground'>
											Bugs & Issues
										</h5>
									</div>

									<div className='grid gap-3'>
										{issues.length === 0 ? (
											<div className='flex flex-col items-center justify-center py-12 text-center bg-emerald-50/30 rounded-2xl border border-emerald-100'>
												<div className='p-3 rounded-full bg-emerald-100 text-emerald-600 mb-3'>
													<CheckCircle className='h-6 w-6' />
												</div>
												<h5 className='text-sm font-semibold text-emerald-800'>
													Zero issues detected!
												</h5>
												<p className='text-xs text-emerald-600/70 max-w-[200px] mt-1'>
													Great job! This section follows all SEO best
													practices.
												</p>
											</div>
										) : (
											issues.map((issue, i) => (
												<div
													key={i}
													className='flex flex-col gap-4 p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/10 transition-colors'
												>
													<div className='flex items-start gap-4'>
														<div
															className={`mt-0.5 p-2 rounded-xl ${
																issue.severity === 'high'
																	? 'bg-red-100 text-red-600'
																	: issue.severity === 'medium'
																		? 'bg-amber-100 text-amber-600'
																		: 'bg-blue-100 text-blue-600'
															}`}
														>
															<Activity className='h-5 w-5' />
														</div>
														<div className='flex-1'>
															<div className='flex items-center gap-2 mb-2'>
																<span className='text-sm font-bold text-foreground'>
																	{issue.message}
																</span>
																<Badge
																	variant={
																		issue.severity === 'high'
																			? 'destructive'
																			: 'outline'
																	}
																	className='h-4 px-1.5 text-[8px] uppercase font-bold tracking-wider'
																>
																	{issue.severity}
																</Badge>
															</div>

															{issue.currentValue && (
																<div className='mb-4'>
																	<span className='text-[10px] text-muted-foreground font-bold uppercase tracking-widest'>
																		Detected Value:
																	</span>
																	<div className='mt-1.5 px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-[11px] font-mono leading-relaxed break-all'>
																		{issue.currentValue}
																	</div>
																</div>
															)}

															<div className='p-3 rounded-xl bg-primary/5 border border-primary/10'>
																<p className='text-xs text-foreground leading-relaxed'>
																	<span className='font-bold text-primary mr-2'>
																		WAY TO FIX:
																	</span>
																	{issue.fix}
																</p>
															</div>
														</div>
													</div>
												</div>
											))
										)}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className='p-4 border-t bg-muted/10 flex justify-end'>
					<Button
						onClick={onClose}
						variant='secondary'
						className='rounded-xl'
					>
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
						variant={severity === 'high' ? 'destructive' : 'outline'}
						className={`h-4 px-1 text-[9px] rounded-sm uppercase ${severity === 'medium' ? 'border-amber-500 text-amber-600' : ''}`}
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
							className='group relative flex items-start gap-3 p-2 rounded-xl border border-border/60 bg-card hover:bg-muted/30'
						>
							<div className='shrink-0 w-12 h-12 rounded-lg bg-muted border border-border/40 overflow-hidden flex items-center justify-center'>
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
										<Badge
											variant='outline'
											className='h-4 px-1 text-[9px] font-normal italic'
										>
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
						className='group flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30'
					>
						<div
							className={`shrink-0 p-2 rounded-lg ${item.type === 'js' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}
						>
							{item.type === 'js' ? (
								<Activity className='h-4 w-4' />
							) : (
								<FileWarning className='h-4 w-4' />
							)}
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
								<Badge
									variant='outline'
									className='h-4 px-1.5 text-[9px] font-bold uppercase'
								>
									{item.type}
								</Badge>
								{item.isBlocking && (
									<Badge
										variant='destructive'
										className='h-4 px-1.5 text-[9px] font-bold uppercase'
									>
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
