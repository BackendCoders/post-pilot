'use client';

import { useState, useMemo, useCallback } from 'react';
import {
	X,
	Loader2,
	Pencil,
	Trash2,
	Plus,
	FolderOpen,
	MoreHorizontal,
	Check,
	AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
	useGetLeadCategory,
	useCreateLeadCategory,
	useUpdateLeadCategory,
	useDeleteLeadCategory,
} from '@/query/leadsCategory.query';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLeads } from '@/query/leads.query';

type Props = {
	isOpen: boolean;
	onClose: () => void;
};

export default function ManageCategoriesDialog({ isOpen, onClose }: Props) {
	const { data: categoriesResponse, isLoading } = useGetLeadCategory();
	const createMutation = useCreateLeadCategory();
	const updateMutation = useUpdateLeadCategory();
	const deleteMutation = useDeleteLeadCategory();

	const categories = categoriesResponse?.data || [];

	const { data: leadsResponse } = useLeads();
	const leads = (leadsResponse?.data as ILead[]) || [];

	const getLeadCategoryId = useCallback((lead: ILead) => {
		const lc = lead.leadCategory as unknown as string | { _id?: string } | undefined;
		if (!lc) return '';
		if (typeof lc === 'string') return lc;
		return lc._id || '';
	}, []);

	const leadCountByCategory = useMemo(() => {
		const map = new Map<string, number>();
		for (const lead of leads) {
			const catId = getLeadCategoryId(lead);
			if (catId) map.set(catId, (map.get(catId) || 0) + 1);
		}
		return map;
	}, [leads, getLeadCategoryId]);

	const [newCategoryName, setNewCategoryName] = useState('');
	const [newAutoConvert, setNewAutoConvert] = useState(false);
	const [newAutoProcess, setNewAutoProcess] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingTitle, setEditingTitle] = useState('');
	const [editingAutoConvert, setEditingAutoConvert] = useState(false);
	const [editingAutoProcess, setEditingAutoProcess] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handleCreate = () => {
		if (!newCategoryName.trim()) return;
		createMutation.mutate(
			{ 
				title: newCategoryName.trim(),
				autoConvertOnReply: newAutoConvert,
				autoProcessOnSend: newAutoProcess
			},
			{
				onSuccess: () => {
					setNewCategoryName('');
					setNewAutoConvert(false);
					setNewAutoProcess(false);
					setIsCreating(false);
				},
			},
		);
	};

	const handleUpdate = (id: string) => {
		if (!editingTitle.trim()) return;
		updateMutation.mutate(
			{ 
				id, 
				data: { 
					title: editingTitle.trim(),
					autoConvertOnReply: editingAutoConvert,
					autoProcessOnSend: editingAutoProcess
				} 
			},
			{
				onSuccess: () => {
					setEditingId(null);
					setEditingTitle('');
				},
			},
		);
	};

	const handleToggleAutomation = (id: string, field: 'autoConvertOnReply' | 'autoProcessOnSend', value: boolean) => {
		updateMutation.mutate({
			id,
			data: { [field]: value }
		});
	};

	const handleDelete = (id: string) => {
		deleteMutation.mutate(id, {
			onSuccess: () => {
				setDeletingId(null);
			},
		});
	};

	const startEdit = (cat: ILeadCategory) => {
		setEditingId(cat._id);
		setEditingTitle(cat.title);
		setEditingAutoConvert(!!cat.autoConvertOnReply);
		setEditingAutoProcess(!!cat.autoProcessOnSend);
		setDeletingId(null);
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditingTitle('');
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center'>
			<div
				className='absolute inset-0 bg-black/50'
				onClick={onClose}
			/>
			<div className='relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl mx-4'>
				{/* Header */}
				<div className='flex items-center justify-between px-6 py-5 border-b border-border'>
					<div className='flex items-center gap-3'>
						<div className='w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center'>
							<FolderOpen size={18} className='text-primary' />
						</div>
						<div>
							<h2 className='text-lg font-semibold tracking-tight'>
								Manage Categories
							</h2>
							<p className='text-xs text-muted-foreground'>
								{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
							</p>
						</div>
					</div>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						className='rounded-full'
					>
						<X size={16} />
					</Button>
				</div>

				{/* Category List */}
				<div className='flex-1 overflow-y-auto px-6 py-4 space-y-1 scrollbar-hide'>
					{isLoading ? (
						<div className='flex items-center justify-center py-12'>
							<Loader2 size={20} className='animate-spin text-muted-foreground' />
						</div>
					) : categories.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-12 text-center'>
							<div className='w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-3'>
								<FolderOpen size={20} className='text-muted-foreground' />
							</div>
							<p className='text-sm font-medium text-muted-foreground'>
								No categories yet
							</p>
							<p className='text-xs text-muted-foreground mt-1'>
								Create your first category to organize leads
							</p>
						</div>
					) : (
						categories.map((cat: ILeadCategory) => (
							<div key={cat._id}>
								{/* Delete Confirmation */}
								{deletingId === cat._id ? (
									<div className='rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3'>
										<div className='flex items-start gap-3'>
											<AlertTriangle size={16} className='text-destructive mt-0.5 shrink-0' />
											<div>
												<p className='text-sm font-medium'>Delete "{cat.title}"?</p>
												<p className='text-xs text-muted-foreground mt-1'>
													{(leadCountByCategory.get(cat._id) || 0) > 0 ? (
														<><strong className='text-destructive'>{leadCountByCategory.get(cat._id)}</strong> lead{(leadCountByCategory.get(cat._id) || 0) === 1 ? '' : 's'} will be unassigned. This cannot be undone.</>
													) : (
														<>No leads in this category. This cannot be undone.</>
													)}
												</p>
											</div>
										</div>
										<div className='flex items-center justify-end gap-2'>
											<Button
												size='sm'
												variant='outline'
												onClick={() => setDeletingId(null)}
												className='h-8 text-xs'
											>
												Cancel
											</Button>
											<Button
												size='sm'
												variant='destructive'
												onClick={() => handleDelete(cat._id)}
												disabled={deleteMutation.isPending}
												className='h-8 text-xs'
											>
												{deleteMutation.isPending ? (
													<Loader2 size={12} className='mr-1.5 animate-spin' />
												) : (
													<Trash2 size={12} className='mr-1.5' />
												)}
												Delete
											</Button>
										</div>
									</div>
								) : editingId === cat._id ? (
									/* Inline Edit */
									<div className='rounded-xl bg-muted/40 px-3 py-3 space-y-3'>
										<div className='text-[10px] font-medium text-muted-foreground'>
											Editing Category · {leadCountByCategory.get(cat._id) || 0} leads
										</div>
										<div className='flex items-center gap-2'>
											<Input
												value={editingTitle}
												onChange={(e) => setEditingTitle(e.target.value)}
												className='h-9 flex-1 text-sm bg-background'
												autoFocus
											/>
											<div className='flex items-center gap-1'>
												<Button
													size='icon'
													variant='ghost'
													className='h-9 w-9 shrink-0 text-primary hover:bg-primary/10'
													onClick={() => handleUpdate(cat._id)}
													disabled={updateMutation.isPending || !editingTitle.trim()}
												>
													{updateMutation.isPending ? (
														<Loader2 size={14} className='animate-spin' />
													) : (
														<Check size={14} />
													)}
												</Button>
												<Button
													size='icon'
													variant='ghost'
													className='h-9 w-9 shrink-0'
													onClick={cancelEdit}
												>
													<X size={14} />
												</Button>
											</div>
										</div>
										
										<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
											<div className='flex items-center space-x-2 group/tip'>
												<Checkbox 
													id={`edit-convert-${cat._id}`}
													checked={editingAutoConvert}
													onCheckedChange={(checked) => setEditingAutoConvert(!!checked)}
												/>
												<Label 
													htmlFor={`edit-convert-${cat._id}`} 
													className='text-[11px] font-medium cursor-pointer flex items-center gap-1'
													title="Auto promote leads to 'Converted' when they reply to a message"
												>
													Auto-Convert (Reply)
													<div className="w-3 h-3 rounded-full border border-muted-foreground/30 flex items-center justify-center text-[8px] text-muted-foreground/60">?</div>
												</Label>
											</div>
											<div className='flex items-center space-x-2 group/tip'>
												<Checkbox 
													id={`edit-process-${cat._id}`}
													checked={editingAutoProcess}
													onCheckedChange={(checked) => setEditingAutoProcess(!!checked)}
												/>
												<Label 
													htmlFor={`edit-process-${cat._id}`} 
													className='text-[11px] font-medium cursor-pointer flex items-center gap-1'
													title="Auto promote 'Saved' leads to 'Processing' when you send them a message"
												>
													Auto-Process (Sent)
													<div className="w-3 h-3 rounded-full border border-muted-foreground/30 flex items-center justify-center text-[8px] text-muted-foreground/60">?</div>
												</Label>
											</div>
										</div>
									</div>
								) : (
									/* Category Row */
									<div
										className={cn(
											'group flex flex-col rounded-xl px-3 py-2.5 transition-all duration-200',
											'hover:bg-muted/40',
										)}
									>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-3 min-w-0'>
												<div className='w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0'>
													<FolderOpen size={14} className='text-primary/60' />
												</div>
												<span className='text-sm font-medium truncate'>
													{cat.title}
												</span>
												<span className='rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground tabular-nums shrink-0'>
													{leadCountByCategory.get(cat._id) || 0}
												</span>
											</div>

											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														size='icon'
														variant='ghost'
														className='h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity'
													>
														<MoreHorizontal size={14} />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end' className='w-36'>
													<DropdownMenuItem
														onClick={() => startEdit(cat)}
														className='cursor-pointer'
													>
														<Pencil size={14} className='mr-2' />
														Rename
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => {
															setDeletingId(cat._id);
															setEditingId(null);
														}}
														className='cursor-pointer text-destructive focus:text-destructive'
													>
														<Trash2 size={14} className='mr-2' />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
										
										{/* Automation Quick Toggles */}
										<div className='flex items-center gap-4 pl-11 pt-1.5'>
											<div className='flex items-center space-x-1.5'>
												<Checkbox 
													id={`list-convert-${cat._id}`}
													checked={!!cat.autoConvertOnReply}
													onCheckedChange={(checked) => handleToggleAutomation(cat._id, 'autoConvertOnReply', !!checked)}
													className="w-3 h-3 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
												/>
												<Label 
													htmlFor={`list-convert-${cat._id}`} 
													className='text-[10px] font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors'
													title="Auto promote leads to 'Converted' when they reply to a message"
												>
													Auto-Convert (Reply)
												</Label>
											</div>
											<div className='flex items-center space-x-1.5'>
												<Checkbox 
													id={`list-process-${cat._id}`}
													checked={!!cat.autoProcessOnSend}
													onCheckedChange={(checked) => handleToggleAutomation(cat._id, 'autoProcessOnSend', !!checked)}
													className="w-3 h-3 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
												/>
												<Label 
													htmlFor={`list-process-${cat._id}`} 
													className='text-[10px] font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors'
													title="Auto promote 'Saved' leads to 'Processing' when you send them a message"
												>
													Auto-Process (Sent)
												</Label>
											</div>
										</div>
									</div>
								)}
							</div>
						))
					)}
				</div>

				{/* Footer — Create */}
				<div className='border-t border-border px-6 py-4 bg-muted/10'>
					{isCreating ? (
						<div className='space-y-4'>
							<div className='flex items-center gap-2'>
								<Input
									value={newCategoryName}
									onChange={(e) => setNewCategoryName(e.target.value)}
									placeholder='Category name...'
									className='h-9 flex-1 text-sm'
									autoFocus
								/>
								<Button
									size='sm'
									onClick={handleCreate}
									disabled={createMutation.isPending || !newCategoryName.trim()}
									className='h-9'
								>
									{createMutation.isPending ? (
										<Loader2 size={14} className='mr-1.5 animate-spin' />
									) : (
										<Plus size={14} className='mr-1.5' />
									)}
									Add
								</Button>
								<Button
									size='sm'
									variant='outline'
									onClick={() => {
										setIsCreating(false);
										setNewCategoryName('');
										setNewAutoConvert(false);
										setNewAutoProcess(false);
									}}
									className='h-9'
								>
									Cancel
								</Button>
							</div>
							
							<div className='grid grid-cols-2 gap-4 px-1'>
								<div className='flex items-center space-x-2'>
									<Checkbox 
										id="new-convert" 
										checked={newAutoConvert}
										onCheckedChange={(checked) => setNewAutoConvert(!!checked)}
									/>
									<Label 
										htmlFor="new-convert" 
										className='text-[11px] font-medium cursor-pointer flex items-center gap-1'
										title="Auto promote leads to 'Converted' when they reply to a message"
									>
										Auto-Convert
										<div className="w-3 h-3 rounded-full border border-muted-foreground/30 flex items-center justify-center text-[8px] text-muted-foreground/60">?</div>
									</Label>
								</div>
								<div className='flex items-center space-x-2'>
									<Checkbox 
										id="new-process" 
										checked={newAutoProcess}
										onCheckedChange={(checked) => setNewAutoProcess(!!checked)}
									/>
									<Label 
										htmlFor="new-process" 
										className='text-[11px] font-medium cursor-pointer flex items-center gap-1'
										title="Auto promote 'Saved' leads to 'Processing' when you send them a message"
									>
										Auto-Process
										<div className="w-3 h-3 rounded-full border border-muted-foreground/30 flex items-center justify-center text-[8px] text-muted-foreground/60">?</div>
									</Label>
								</div>
							</div>
						</div>
					) : (
						<Button
							variant='outline'
							className='w-full h-9 text-sm'
							onClick={() => setIsCreating(true)}
						>
							<Plus size={14} className='mr-2' />
							New Category
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
