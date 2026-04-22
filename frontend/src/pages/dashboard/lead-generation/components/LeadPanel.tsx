import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
	CheckSquare,
	Filter,
	Folder,
	Inbox,
	PanelLeftClose,
	PanelLeftOpen,
	Search,
	Square,
	Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	useBulkUpdateLeads,
	useDeleteBulkLeads,
	useLeads,
} from '@/query/leads.query';
import { useGetLeadCategory } from '@/query/leadsCategory.query';
import LeadWorkspaceToggle from './LeadWorkspaceToggle';
import type { LeadViewMode } from './leadWorkspace.constants';
import LeadKanbanBoard from './LeadKanbanBoard';
import LeadListView from './LeadListView';
import LeadFloatingDock from './LeadFloatingDock';
import LeadDetailsPanel from './LeadDetailsPanel';
import ReachDialog from './ReachDialog';
import EditLeadDialog from './EditLeadDialog';

export type LeadPanelSection = 'saved' | 'processed' | 'converted' | 'rejected';

export default function LeadPanel({ section }: { section: LeadPanelSection }) {
	const [searchParams, setSearchParams] = useSearchParams();
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
		searchParams.get('category') || '',
	);
	const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(
		new Set(),
	);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedLead, setSelectedLead] = useState<ILead | null>(null);
	const [viewMode, setViewMode] = useState<LeadViewMode>(
		(searchParams.get('view') as LeadViewMode) || 'kanban',
	);
	const [statusFilter, setStatusFilter] = useState<
		'all' | 'saved' | 'processed' | 'converted' | 'rejected'
	>('all');
	const [isWorkspaceSidebarCollapsed, setIsWorkspaceSidebarCollapsed] =
		useState(false);
	const [isReachDialogOpen, setIsReachDialogOpen] = useState(false);
	const [isCreateLeadDialogOpen, setIsCreateLeadDialogOpen] = useState(false);

	const { data: categoriesResponse, isLoading: isLoadingCategories } =
		useGetLeadCategory();
	const { data: leadsResponse, isLoading: isLoadingLeads } = useLeads();
	const { mutate: deleteLeadBulk } = useDeleteBulkLeads();
	const { mutate: updateLeadBulkStatus } = useBulkUpdateLeads();

	const categories = categoriesResponse?.data || [];
	const leads = (leadsResponse?.data as ILead[]) || [];

	const getLeadCategoryId = useCallback((lead: ILead) => {
		const leadCategoryValue = lead.leadCategory as
			| string
			| { _id?: string }
			| undefined;
		if (!leadCategoryValue) return '';
		if (typeof leadCategoryValue === 'string') return leadCategoryValue;
		return leadCategoryValue._id || '';
	}, []);

	console.log({ selectedCategoryId });

	useEffect(() => {
		setSelectedCategoryId(searchParams.get('category') || '');
		const currentView = searchParams.get('view') as LeadViewMode | null;
		if (currentView === 'kanban' || currentView === 'list') {
			setViewMode(currentView);
		}
		const currentStatusFilter = searchParams.get('statusFilter');
		if (
			currentStatusFilter === 'all' ||
			currentStatusFilter === 'saved' ||
			currentStatusFilter === 'processed' ||
			currentStatusFilter === 'converted' ||
			currentStatusFilter === 'rejected'
		) {
			setStatusFilter(currentStatusFilter);
		} else {
			setStatusFilter('all');
		}
	}, [searchParams]);

	const leadsByCategory = useMemo(() => {
		const map = new Map<string, ILead[]>();
		for (const lead of leads) {
			const categoryId = getLeadCategoryId(lead);
			if (!categoryId) continue;
			const existing = map.get(categoryId) || [];
			existing.push(lead);
			map.set(categoryId, existing);
		}
		return map;
	}, [getLeadCategoryId, leads]);

	const categoryScopedLeads = useMemo(
		() =>
			selectedCategoryId
				? leads.filter((lead) => getLeadCategoryId(lead) === selectedCategoryId)
				: leads,
		[getLeadCategoryId, leads, selectedCategoryId],
	);

	const filteredLeads = useMemo(() => {
		if (!searchQuery.trim()) return categoryScopedLeads;
		const query = searchQuery.toLowerCase();
		return categoryScopedLeads.filter(
			(lead) =>
				lead.title?.toLowerCase().includes(query) ||
				lead.address?.toLowerCase().includes(query) ||
				lead.category?.toLowerCase().includes(query),
		);
	}, [categoryScopedLeads, searchQuery]);

	const statusFilteredLeads = useMemo(() => {
		if (statusFilter === 'all') return filteredLeads;
		return filteredLeads.filter(
			(lead) => String(lead.status).toLowerCase() === statusFilter,
		);
	}, [filteredLeads, statusFilter]);

	const sectionTitle = useMemo(() => {
		if (section === 'processed') return 'Processed Leads Workspace';
		if (section === 'converted') return 'Complete Leads Workspace';
		if (section === 'rejected') return 'Rejected Leads Workspace';
		return 'Saved Leads Workspace';
	}, [section]);

	useEffect(() => {
		if (!selectedLead) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setSelectedLead(null);
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [selectedLead]);

	const statusCounts = useMemo(() => {
		const counts = {
			all: filteredLeads.length,
			saved: 0,
			processed: 0,
			converted: 0,
			rejected: 0,
		};

		for (const lead of filteredLeads) {
			const status = String(lead.status).toLowerCase();
			if (status === 'saved') counts.saved += 1;
			else if (status === 'processed') counts.processed += 1;
			else if (status === 'converted') counts.converted += 1;
			else if (status === 'rejected') counts.rejected += 1;
		}

		return counts;
	}, [filteredLeads]);

	const updateStatusFilterInUrl = (
		value: 'all' | 'saved' | 'processed' | 'converted' | 'rejected',
	) => {
		const next = new URLSearchParams(searchParams);
		if (value === 'all') next.delete('statusFilter');
		else next.set('statusFilter', value);
		setSearchParams(next);
	};

	useEffect(() => {
		const availableIds = new Set(
			statusFilteredLeads
				.map((lead) => lead._id)
				.filter((id): id is string => Boolean(id)),
		);
		setSelectedLeadIds((prev) => {
			const next = new Set([...prev].filter((id) => availableIds.has(id)));
			return next.size === prev.size ? prev : next;
		});
	}, [statusFilteredLeads]);

	const updateCategoryInUrl = (categoryId: string) => {
		const next = new URLSearchParams(searchParams);
		if (categoryId) next.set('category', categoryId);
		else next.delete('category');
		setSearchParams(next);
	};

	const updateViewInUrl = (mode: LeadViewMode) => {
		const next = new URLSearchParams(searchParams);
		next.set('view', mode);
		setSearchParams(next);
	};

	const toggleLeadSelection = (id: string) => {
		setSelectedLeadIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleSelectAll = () => {
		const selectableIds = filteredLeads
			.map((lead) => lead._id)
			.filter((id): id is string => Boolean(id));

		if (
			selectableIds.length > 0 &&
			selectableIds.every((id) => selectedLeadIds.has(id))
		) {
			setSelectedLeadIds(new Set());
			return;
		}

		setSelectedLeadIds(new Set(selectableIds));
	};

	const toggleSelectAllVisible = () => {
		const selectableIds = statusFilteredLeads
			.map((lead) => lead._id)
			.filter((id): id is string => Boolean(id));

		if (
			selectableIds.length > 0 &&
			selectableIds.every((id) => selectedLeadIds.has(id))
		) {
			setSelectedLeadIds(new Set());
			return;
		}

		setSelectedLeadIds(new Set(selectableIds));
	};

	const toggleKanbanColumnSelection = (ids: string[]) => {
		if (!ids.length) return;
		setSelectedLeadIds((prev) => {
			const allSelected = ids.every((id) => prev.has(id));
			const next = new Set(prev);
			if (allSelected) {
				for (const id of ids) next.delete(id);
			} else {
				for (const id of ids) next.add(id);
			}
			return next;
		});
	};

	const moveLeadIdsToStatus = (
		ids: string[],
		status: 'saved' | 'processed' | 'converted' | 'rejected',
	) => {
		if (!ids.length) return;
		updateLeadBulkStatus(
			{ ids, status },
			{
				onSuccess: () => {
					setSelectedLeadIds(new Set());
					setSelectedLead((current) => {
						if (!current?._id) return current;
						return ids.includes(current._id) ? null : current;
					});
				},
			},
		);
	};

	const moveSelectedToStatus = (
		status: 'saved' | 'processed' | 'converted' | 'rejected',
	) => {
		const ids = filteredLeads
			.filter(
				(lead) =>
					lead._id &&
					selectedLeadIds.has(lead._id) &&
					String(lead.status).toLowerCase() !== status,
			)
			.map((lead) => lead._id as string);
		moveLeadIdsToStatus(ids, status);
	};

	const moveSelectedVisibleToStatus = (
		status: 'saved' | 'processed' | 'converted' | 'rejected',
	) => {
		const ids = statusFilteredLeads
			.filter(
				(lead) =>
					lead._id &&
					selectedLeadIds.has(lead._id) &&
					String(lead.status).toLowerCase() !== status,
			)
			.map((lead) => lead._id as string);
		moveLeadIdsToStatus(ids, status);
	};

	const escapeCsvValue = (value: unknown) => {
		const stringValue =
			value === null || value === undefined ? '' : String(value);
		const escaped = stringValue.replace(/"/g, '""');
		return `"${escaped}"`;
	};

	const handleExportCsv = () => {
		const leadsToExport = filteredLeads.filter((lead) =>
			lead._id ? selectedLeadIds.has(lead._id) : false,
		);
		if (!leadsToExport.length) return;

		const headers = [
			'phone',
			'title',
			'address',
			'latitude',
			'longitude',
			'ratings',
			'rating_count',
			'googlemapurl',
			'website',
			'status',
		];

		const rows = leadsToExport.map((lead) => [
			lead.phone,
			lead.title,
			lead.address,
			lead.latitude,
			lead.longitude,
			lead.rating,
			lead.ratingCount,
			lead.googleMapUrl,
			lead.website,
			lead.status,
		]);

		const csv = [headers, ...rows]
			.map((row) => row.map((cell) => escapeCsvValue(cell)).join(','))
			.join('\n');

		const blob = new Blob([`\uFEFF${csv}`], {
			type: 'text/csv;charset=utf-8;',
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'leads-workspace.csv';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const handleExportVisibleCsv = () => {
		const leadsToExport = statusFilteredLeads.filter((lead) =>
			lead._id ? selectedLeadIds.has(lead._id) : false,
		);
		if (!leadsToExport.length) return;

		const headers = [
			'phone',
			'title',
			'address',
			'latitude',
			'longitude',
			'ratings',
			'rating_count',
			'googlemapurl',
			'website',
			'status',
		];

		const rows = leadsToExport.map((lead) => [
			lead.phone,
			lead.title,
			lead.address,
			lead.latitude,
			lead.longitude,
			lead.rating,
			lead.ratingCount,
			lead.googleMapUrl,
			lead.website,
			lead.status,
		]);

		const csv = [headers, ...rows]
			.map((row) => row.map((cell) => escapeCsvValue(cell)).join(','))
			.join('\n');

		const blob = new Blob([`\uFEFF${csv}`], {
			type: 'text/csv;charset=utf-8;',
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'leads-workspace.csv';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const handleDeleteBulk = () => {
		const ids = [...selectedLeadIds];
		if (!ids.length) return;
		deleteLeadBulk(ids, {
			onSuccess: () => {
				setSelectedLeadIds(new Set());
				setSelectedLead(null);
			},
		});
	};

	const allVisibleSelected =
		(viewMode === 'list' ? statusFilteredLeads : filteredLeads).length > 0 &&
		(viewMode === 'list' ? statusFilteredLeads : filteredLeads).every((lead) =>
			lead._id ? selectedLeadIds.has(lead._id) : false,
		);

	return (
		<div className='relative flex h-[calc(100vh-140px)] rounded-3xl border border-border bg-background font-sans'>
			<aside
				className={cn(
					'border-r border-border bg-card/50 flex flex-col transition-all duration-300 overflow-y-auto scrollbar-hide',
					isWorkspaceSidebarCollapsed ? 'w-20' : 'w-72',
				)}
			>
				<div className='p-6'>
					<div
						className={cn(
							'mb-4 flex items-center',
							isWorkspaceSidebarCollapsed
								? 'justify-center'
								: 'justify-between',
						)}
					>
						{!isWorkspaceSidebarCollapsed && (
							<h2 className='flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground'>
								<Filter
									size={14}
									className='text-primary'
								/>
								Workspace Categories
							</h2>
						)}
						<button
							type='button'
							onClick={() => setIsWorkspaceSidebarCollapsed((prev) => !prev)}
							className='rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all'
							title={
								isWorkspaceSidebarCollapsed
									? 'Expand workspace sidebar'
									: 'Collapse workspace sidebar'
							}
						>
							{isWorkspaceSidebarCollapsed ? (
								<PanelLeftOpen size={16} />
							) : (
								<PanelLeftClose size={16} />
							)}
						</button>
					</div>

					<nav className='space-y-1'>
						<button
							onClick={() => {
								setSelectedCategoryId('');
								setSelectedLeadIds(new Set());
								updateCategoryInUrl('');
							}}
							className={cn(
								'w-full flex items-center rounded-[12px] text-sm transition-all duration-200 active:scale-95',
								isWorkspaceSidebarCollapsed
									? 'justify-center px-2 py-3'
									: 'gap-3 px-4 py-3',
								selectedCategoryId === ''
									? 'bg-primary/10 text-primary font-semibold'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground',
							)}
							title='All Leads'
						>
							<Inbox size={18} />
							{!isWorkspaceSidebarCollapsed && <span>All Leads</span>}
						</button>

						{!isWorkspaceSidebarCollapsed && (
							<div className='px-4 pb-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
								Categories
							</div>
						)}

						{isLoadingCategories ? (
							<div className='p-4 text-xs text-muted-foreground'>
								Loading categories...
							</div>
						) : (
							categories.map((cat: ILeadCategory) => {
								const total = (leadsByCategory.get(cat._id) || []).length;
								return (
									<button
										key={cat._id}
										onClick={() => {
											setSelectedCategoryId(cat._id);
											setSelectedLeadIds(new Set());
											updateCategoryInUrl(cat._id);
										}}
										className={cn(
											'w-full flex items-center rounded-[12px] text-sm transition-all active:scale-95 group',
											isWorkspaceSidebarCollapsed
												? 'justify-center px-2 py-2.5'
												: 'gap-3 px-4 py-2.5',
											selectedCategoryId === cat._id
												? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-medium'
												: 'text-muted-foreground hover:bg-muted',
										)}
										title={cat.title}
									>
										<Folder
											size={16}
											className={cn(
												selectedCategoryId === cat._id
													? 'text-white'
													: 'text-primary/40',
											)}
										/>
										{!isWorkspaceSidebarCollapsed && (
											<>
												<span className='flex-1 truncate text-left'>
													{cat.title}
												</span>
												<span className='rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground'>
													{total}
												</span>
											</>
										)}
									</button>
								);
							})
						)}
					</nav>
				</div>
			</aside>

			<main className='relative flex flex-1 flex-col bg-background overflow-y-auto scrollbar-hide'>
				<header className='sticky top-0 z-20 h-20 border-b border-border bg-background/80 px-8 backdrop-blur-md'>
					<div className='flex h-full items-center justify-between gap-4'>
						<div className='flex-shrink-0'>
							<h1 className='text-xl font-medium tracking-tight'>
								{sectionTitle}
							</h1>
							<p className='text-xs font-medium text-muted-foreground'>
								{filteredLeads.length} leads in view
							</p>
						</div>

						<div className='flex-shrink-0'>
							<LeadWorkspaceToggle
								value={viewMode}
								onChange={(mode) => {
									setViewMode(mode);
									updateViewInUrl(mode);
								}}
							/>
						</div>

						<div className='flex flex-1 max-w-md relative group'>
							<Search
								className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary'
								size={16}
							/>
							<input
								type='text'
								placeholder='Search leads...'
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								className='w-full rounded-[12px] border-none bg-muted/40 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:bg-muted/60 focus:ring-2 focus:ring-primary/20'
							/>
						</div>

						<Button
							onClick={() => setIsCreateLeadDialogOpen(true)}
							className='flex-shrink-0'
						>
							<Plus size={16} className='mr-2' />
							Create Lead
						</Button>
					</div>
				</header>

				<div className='border-b border-border bg-muted/20 px-8 py-3 flex items-center gap-4'>
					<button
						type='button'
						onClick={
							viewMode === 'list' ? toggleSelectAllVisible : toggleSelectAll
						}
						className='text-muted-foreground transition-colors hover:text-primary active:scale-90'
					>
						{allVisibleSelected ? (
							<CheckSquare className='h-5 w-5 text-primary' />
						) : (
							<Square className='h-5 w-5' />
						)}
					</button>
					<span className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
						{selectedLeadIds.size > 0
							? `${selectedLeadIds.size} selected`
							: 'Select one or more leads to move across panels'}
					</span>
				</div>
				{viewMode === 'list' && (
					<div className='border-b border-border bg-background px-8 py-3'>
						<div className='flex flex-wrap items-center gap-2'>
							{[
								{ key: 'all', label: 'All', count: statusCounts.all },
								{ key: 'saved', label: 'Saved', count: statusCounts.saved },
								{
									key: 'processed',
									label: 'Processed',
									count: statusCounts.processed,
								},
								{
									key: 'converted',
									label: 'Complete',
									count: statusCounts.converted,
								},
								{
									key: 'rejected',
									label: 'Rejected',
									count: statusCounts.rejected,
								},
							].map((item) => (
								<button
									key={item.key}
									type='button'
									onClick={() => {
										const next = item.key as
											| 'all'
											| 'saved'
											| 'processed'
											| 'converted'
											| 'rejected';
										setStatusFilter(next);
										updateStatusFilterInUrl(next);
										setSelectedLeadIds(new Set());
									}}
									className={cn(
										'rounded-full px-3 py-1.5 text-xs font-semibold transition-all border',
										statusFilter === item.key
											? 'bg-primary text-primary-foreground border-primary'
											: 'bg-muted/50 text-muted-foreground border-border hover:text-foreground',
									)}
								>
									{item.label} ({item.count})
								</button>
							))}
						</div>
					</div>
				)}

				<div className='flex flex-1 min-h-0 overflow-y-auto scrollbar-hide'>
					<div className='flex-1 min-w-0 overflow-y-auto scrollbar-hide'>
						{viewMode === 'kanban' ? (
							<div className='h-full p-4'>
								<LeadKanbanBoard
									leads={filteredLeads}
									selectedLeadIds={selectedLeadIds}
									isLoading={isLoadingLeads}
									onToggleLeadSelection={toggleLeadSelection}
									onToggleColumnSelection={toggleKanbanColumnSelection}
									onOpenLead={setSelectedLead}
									onMoveLeads={moveLeadIdsToStatus}
								/>
							</div>
						) : (
							<LeadListView
								leads={statusFilteredLeads}
								selectedLeadIds={selectedLeadIds}
								isLoading={isLoadingLeads}
								onToggleLeadSelection={toggleLeadSelection}
								onOpenLead={setSelectedLead}
							/>
						)}
					</div>

					<LeadDetailsPanel
						lead={selectedLead}
						onClose={() => setSelectedLead(null)}
					/>
				</div>

				<LeadFloatingDock
					selectedCount={selectedLeadIds.size}
					onExport={
						viewMode === 'list' ? handleExportVisibleCsv : handleExportCsv
					}
					onClear={() => setSelectedLeadIds(new Set())}
					onDelete={handleDeleteBulk}
					onMoveToStatus={
						viewMode === 'list'
							? moveSelectedVisibleToStatus
							: moveSelectedToStatus
					}
					onReach={() => setIsReachDialogOpen(true)}
				/>

				<ReachDialog
					isOpen={isReachDialogOpen}
					// category={}
					onClose={() => setIsReachDialogOpen(false)}
					selectedLeads={leads.filter(
						(lead) => lead._id && selectedLeadIds.has(lead._id),
					)}
				/>

				<EditLeadDialog
					isOpen={isCreateLeadDialogOpen}
					onClose={() => setIsCreateLeadDialogOpen(false)}
					lead={null}
				/>
			</main>
		</div>
	);
}
