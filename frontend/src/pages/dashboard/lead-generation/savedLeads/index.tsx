'use client';

import { useState, useMemo, useEffect } from 'react';
import {
	useDeleteBulkLeads,
	useDeleteLead,
	useLeads,
} from '@/query/leads.query';
import { useGetLeadCategory } from '@/query/leadsCategory.query';
import {
	Folder,
	Search,
	MapPin,
	Building2,
	Star,
	Globe,
	CheckSquare,
	Square,
	Loader2,
	Inbox,
	Filter,
	Phone,
	ExternalLink,
	MoreVertical,
	Download,
	Send,
	Trash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function SavedLead() {
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
	const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(
		new Set(),
	);
	const [searchQuery, setSearchQuery] = useState('');

	// Queries
	const { data: categoriesResponse, isLoading: isLoadingCategories } =
		useGetLeadCategory();
	const { data: leadsResponse, isLoading: isLoadingLeads } =
		useLeads(selectedCategoryId);
	const { mutate: deleteLead } = useDeleteLead();
	const { mutate: deleteLeadBulk, isSuccess: deletedLeadBulkStatus } =
		useDeleteBulkLeads();

	const categories = categoriesResponse?.data || [];
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const leads = (leadsResponse?.data as ILead[]) || [];

	// Filtered leads
	const filteredLeads = useMemo(() => {
		if (!searchQuery.trim()) return leads;
		const query = searchQuery.toLowerCase();
		return leads.filter(
			(lead) =>
				lead.title?.toLowerCase().includes(query) ||
				lead.address?.toLowerCase().includes(query) ||
				lead.category?.toLowerCase().includes(query),
		);
	}, [leads, searchQuery]);

	// Handlers
	const toggleLeadSelection = (id: string) => {
		const newSelected = new Set(selectedLeadIds);
		if (newSelected.has(id)) newSelected.delete(id);
		else newSelected.add(id);
		setSelectedLeadIds(newSelected);
	};

	const toggleSelectAll = () => {
		if (
			selectedLeadIds.size === filteredLeads.length &&
			filteredLeads.length > 0
		) {
			setSelectedLeadIds(new Set());
		} else {
			setSelectedLeadIds(new Set(filteredLeads.map((l) => l._id as string)));
		}
	};

	useEffect(() => {
		if (deletedLeadBulkStatus) setSelectedLeadIds(new Set());
	}, [deletedLeadBulkStatus]);

	return (
		<div className='flex h-[calc(100vh-140px)] bg-background font-sans overflow-hidden border border-border rounded-3xl'>
			{/* --- Sidebar (Google Navigation Style) --- */}
			<aside className='w-72 border-r border-border bg-card/50 flex flex-col'>
				<div className='p-6'>
					<h2 className='text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4'>
						<Filter
							size={14}
							className='text-primary'
						/>{' '}
						Workspace
					</h2>

					<nav className='space-y-1'>
						<button
							onClick={() => setSelectedCategoryId('')}
							className={cn(
								'w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm transition-all duration-200 active:scale-95',
								selectedCategoryId === ''
									? 'bg-primary/10 text-primary font-semibold'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground',
							)}
						>
							<Inbox size={18} />
							<span>All Leads</span>
						</button>

						<div className='pt-4 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4'>
							Categories
						</div>

						{isLoadingCategories ? (
							<div className='flex justify-center p-4'>
								<Loader2 className='animate-spin h-4 w-4 text-muted-foreground' />
							</div>
						) : (
							categories.map((cat: ILeadCategory) => (
								<button
									key={cat._id}
									onClick={() => setSelectedCategoryId(cat._id)}
									className={cn(
										'w-full flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-sm transition-all active:scale-95 group',
										selectedCategoryId === cat._id
											? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-medium'
											: 'text-muted-foreground hover:bg-muted',
									)}
								>
									<Folder
										size={16}
										className={cn(
											selectedCategoryId === cat._id
												? 'text-white'
												: 'text-primary/40',
										)}
									/>
									<span className='flex-1 truncate'>{cat.title}</span>
								</button>
							))
						)}
					</nav>
				</div>
			</aside>

			{/* --- Main Content Area --- */}
			<main className='flex-1 flex flex-col bg-background'>
				{/* Header Bar */}
				<header className='h-20 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-md sticky top-0 z-20'>
					<div>
						<h1 className='text-xl font-medium tracking-tight'>
							{selectedCategoryId
								? categories.find(
										(c: ILeadCategory) => c._id === selectedCategoryId,
									)?.title
								: 'Lead Explorer'}
						</h1>
						<p className='text-xs text-muted-foreground font-medium'>
							{filteredLeads.length} leads in view
						</p>
					</div>

					<div className='relative group'>
						<Search
							className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors'
							size={16}
						/>
						<input
							type='text'
							placeholder='Search leads...'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='pl-10 pr-4 py-2.5 bg-muted/40 border-none rounded-[12px] text-sm outline-none focus:bg-muted/60 focus:ring-2 focus:ring-primary/20 transition-all w-72'
						/>
					</div>
				</header>

				{/* Lead Table Header / Selection Bar */}
				<div className='px-8 py-3 bg-muted/20 border-b border-border flex items-center gap-4'>
					<button
						onClick={toggleSelectAll}
						className='text-muted-foreground hover:text-primary transition-colors active:scale-90'
					>
						{selectedLeadIds.size === filteredLeads.length &&
						filteredLeads.length > 0 ? (
							<CheckSquare className='w-5 h-5 text-primary' />
						) : (
							<Square className='w-5 h-5' />
						)}
					</button>
					<span className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
						{selectedLeadIds.size > 0
							? `${selectedLeadIds.size} selected`
							: 'Lead Information'}
					</span>
				</div>

				{/* --- List Body --- */}
				<div className='flex-1 overflow-y-auto divide-y divide-border/50'>
					{isLoadingLeads ? (
						<div className='h-full flex items-center justify-center'>
							<Loader2 className='animate-spin text-primary' />
						</div>
					) : filteredLeads.length === 0 ? (
						<div className='h-full flex flex-col items-center justify-center opacity-40'>
							<Building2
								size={48}
								className='mb-4'
							/>
							<p>No leads found</p>
						</div>
					) : (
						filteredLeads.map((lead) => (
							<div
								key={lead._id}
								className={cn(
									'group flex items-center gap-6 px-8 py-5 transition-all duration-200 hover:bg-muted/30 cursor-pointer',
									selectedLeadIds.has(lead._id!) && 'bg-primary/4',
								)}
							>
								{/* Selection */}
								<button
									onClick={() => toggleLeadSelection(lead._id!)}
									className='shrink-0'
								>
									{selectedLeadIds.has(lead._id!) ? (
										<CheckSquare className='w-5 h-5 text-primary' />
									) : (
										<Square className='w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground' />
									)}
								</button>

								{/* Thumbnail Image */}
								{lead.thumbnailUrl && (
									<img
										src={lead.thumbnailUrl}
										alt={lead.title}
										className='shrink-0 w-16 h-16 rounded-lg object-cover'
									/>
								)}

								{/* Lead Info */}
								<div className='flex-1 min-w-0'>
									<div className='flex items-center gap-3 mb-1'>
										<h3 className='font-semibold text-base truncate group-hover:text-primary transition-colors'>
											{lead.title}
										</h3>
										{lead.rating && (
											<span className='flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full'>
												<Star
													size={10}
													fill='currentColor'
												/>{' '}
												{lead.rating}
											</span>
										)}
									</div>

									<div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
										<div className='flex items-center gap-1.5'>
											<MapPin
												size={13}
												className='text-primary/50'
											/>{' '}
											{lead.address}
										</div>
										{lead.phone && (
											<a
												href={`tel:${lead.phone}`}
												className='flex items-center gap-1.5 text-blue-600 hover:underline'
											>
												<Phone
													size={13}
													className='text-primary/50'
												/>{' '}
												{lead.phone}
											</a>
										)}
										{lead.website && (
											<a
												href={lead.website}
												target='_blank'
												rel='noopener noreferrer'
												className='flex items-center gap-1.5 text-blue-600 hover:underline'
											>
												<Globe size={13} /> Website
											</a>
										)}
									</div>
								</div>

								{/* Action Buttons */}
								<div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
									<Button
										variant='ghost'
										size='icon'
										className='rounded-full h-9 w-9 text-muted-foreground hover:text-primary'
										onClick={() =>
											lead.website && window.open(lead.website, '_blank')
										}
									>
										<ExternalLink size={18} />
									</Button>
									<Button
										variant='ghost'
										onClick={() => deleteLead(lead._id!)}
										size='icon'
										className='rounded-full h-9 w-9 text-muted-foreground'
									>
										<Trash size={18} />
									</Button>
									<Button
										variant='ghost'
										size='icon'
										className='rounded-full h-9 w-9 text-muted-foreground'
									>
										<MoreVertical size={18} />
									</Button>
								</div>
							</div>
						))
					)}
				</div>

				{/* --- Floating Action Bar (Google Material 3 FAB Style) --- */}
				{selectedLeadIds.size > 0 && (
					<div className='absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#1f1f1f] text-white rounded-[20px] px-6 py-4 shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10'>
						<div className='flex items-center gap-4 pr-6 border-r border-white/10'>
							<div className='h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold'>
								{selectedLeadIds.size}
							</div>
							<p className='text-sm font-medium'>Selected</p>
						</div>

						<div className='flex gap-2'>
							<Button
								variant='ghost'
								className='rounded-full text-xs font-semibold uppercase tracking-wider'
							>
								<Download
									size={16}
									className='mr-2'
								/>{' '}
								Export
							</Button>
							<Button
								variant='ghost'
								className='rounded-full text-xs font-semibold uppercase tracking-wider'
							>
								<Send
									size={16}
									className='mr-2'
								/>{' '}
								Reach Out
							</Button>
							<Button
								onClick={() => deleteLeadBulk([...selectedLeadIds])}
								variant='ghost'
								size='icon'
								className='hover:text-red-400 rounded-full h-9 w-9 text-muted-foreground'
							>
								<Trash size={18} />
							</Button>
							<Button
								variant='ghost'
								onClick={() => setSelectedLeadIds(new Set())}
								className='rounded-full text-xs font-semibold uppercase tracking-wider'
							>
								Clear
							</Button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
