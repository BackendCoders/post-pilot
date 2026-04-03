import { useState } from 'react';
import { X, FolderPlus, Save, Loader2, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface LeadCategory {
	_id: string;
	title: string;
}

interface SaveLeadsDialogProps {
	selectedIndices: Set<number>;
	leadCategories: LeadCategory[];
	isSaving: boolean;
	isCreatingCategory: boolean;
	closeSaveDialog: () => void;
	handleCreateCategory: () => void;
	handleBulkSave: () => void;
	// State lifted or managed via props
	selectedLeadCategoryId: string;
	setSelectedLeadCategoryId: (id: string) => void;
	newCategoryTitle: string;
	setNewCategoryTitle: (title: string) => void;
	newCategoryDescription: string;
	setNewCategoryDescription: (desc: string) => void;
}

/**
 * Refactored SaveLeadsDialog
 * Following Material Design 3 (M3) and Google Modernism
 */
export default function SaveLeadsDialog({
	selectedIndices,
	leadCategories,
	isSaving,
	isCreatingCategory,
	closeSaveDialog,
	handleCreateCategory,
	handleBulkSave,
	selectedLeadCategoryId,
	setSelectedLeadCategoryId,
	newCategoryTitle,
	setNewCategoryTitle,
	newCategoryDescription,
	setNewCategoryDescription,
}: SaveLeadsDialogProps) {
	const [showCreateFlow, setShowCreateFlow] = useState(false);

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 font-sans'>
			{/* Backdrop: M3 scrim effect */}
			<div
				className='absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300'
				onClick={closeSaveDialog}
			/>

			{/* Dialog Container: 3xl radius (24px) for M3 Large Containers */}
			<div className='relative z-10 w-full max-w-lg overflow-hidden rounded-[24px] border border-border bg-background shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95'>
				{/* Header */}
				<div className='flex items-start justify-between px-8 py-6'>
					<div className='space-y-1'>
						<h3 className='text-xl font-medium tracking-tight text-foreground'>
							Save selected leads
						</h3>
						<p className='text-sm text-muted-foreground'>
							Add {selectedIndices.size} leads to your CRM workspace.
						</p>
					</div>
					<Button
						variant='ghost'
						size='icon'
						onClick={closeSaveDialog}
						className='rounded-full hover:bg-muted active:scale-95 transition-all'
					>
						<X className='h-5 w-5' />
					</Button>
				</div>

				<div className='px-8 pb-8 space-y-6'>
					{/* Main Category Selection */}
					{!showCreateFlow ? (
						<div className='space-y-4 animate-in slide-in-from-left-2 duration-300'>
							<div className='space-y-2'>
								<Label
									htmlFor='lead-category'
									className='text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1'
								>
									Select CRM Category
								</Label>
								<div className='relative'>
									<select
										id='lead-category'
										value={selectedLeadCategoryId}
										onChange={(e) => setSelectedLeadCategoryId(e.target.value)}
										className='flex h-12 w-full appearance-none rounded-[12px] border border-input bg-background px-4 py-2 text-sm ring-offset-background transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'
									>
										<option value=''>Choose a category...</option>
										{leadCategories.map((category) => (
											<option
												key={category._id}
												value={category._id}
											>
												{category.title}
											</option>
										))}
									</select>
									<div className='pointer-events-none absolute inset-y-0 right-4 flex items-center'>
										<ChevronRight className='h-4 w-4 rotate-90 text-muted-foreground' />
									</div>
								</div>
							</div>

							<button
								type='button'
								onClick={() => setShowCreateFlow(true)}
								className='group flex items-center gap-3 w-full rounded-[12px] border border-dashed border-border p-4 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]'
							>
								<div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors'>
									<Plus className='h-4 w-4' />
								</div>
								<div className='text-left'>
									<p className='text-sm font-medium'>Create new category</p>
									<p className='text-xs text-muted-foreground'>
										Organize leads into a new CRM bucket
									</p>
								</div>
							</button>
						</div>
					) : (
						/* Contextual Creation Flow */
						<div className='space-y-4 animate-in fade-in slide-in-from-right-4 duration-300'>
							<div className='flex items-center justify-between'>
								<h4 className='text-sm font-semibold flex items-center gap-2'>
									<FolderPlus className='h-4 w-4 text-primary' />
									New Category Details
								</h4>
								<Button
									variant='link'
									size='sm'
									onClick={() => setShowCreateFlow(false)}
									className='text-xs text-primary'
								>
									Back to list
								</Button>
							</div>

							<div className='grid gap-4 rounded-[16px] bg-muted/30 p-4 border border-border/50'>
								<div className='space-y-2'>
									<Label
										htmlFor='new-category-title'
										className='text-xs font-medium ml-1'
									>
										Title
									</Label>
									<Input
										id='new-category-title'
										value={newCategoryTitle}
										onChange={(e) => setNewCategoryTitle(e.target.value)}
										placeholder='e.g. Q1 Tech Prospects'
										className='h-10 rounded-[10px] bg-background'
									/>
								</div>

								<div className='space-y-2'>
									<Label
										htmlFor='new-category-description'
										className='text-xs font-medium ml-1'
									>
										Description (Optional)
									</Label>
									<Textarea
										id='new-category-description'
										value={newCategoryDescription}
										onChange={(e) => setNewCategoryDescription(e.target.value)}
										placeholder='Brief context for this category...'
										rows={2}
										className='rounded-[10px] bg-background resize-none'
									/>
								</div>

								<Button
									type='button'
									onClick={handleCreateCategory}
									disabled={isCreatingCategory || !newCategoryTitle}
									className='w-full rounded-[10px] bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all'
								>
									{isCreatingCategory ? (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									) : (
										'Create and Select'
									)}
								</Button>
							</div>
						</div>
					)}
				</div>

				{/* Footer Actions */}
				<div className='flex items-center justify-end gap-3 bg-muted/20 px-8 py-5 border-t border-border'>
					<Button
						variant='ghost'
						onClick={closeSaveDialog}
						className='rounded-[12px] px-5 font-medium hover:bg-muted active:scale-95 transition-all'
					>
						Cancel
					</Button>
					<Button
						onClick={handleBulkSave}
						disabled={isSaving || !selectedLeadCategoryId}
						className='rounded-[12px] px-6 font-medium shadow-md shadow-primary/20 active:scale-95 transition-all bg-primary hover:bg-primary/90'
					>
						{isSaving ? (
							<Loader2 className='mr-2 h-4 w-4 animate-spin' />
						) : (
							<Save className='mr-2 h-4 w-4' />
						)}
						Save to CRM
					</Button>
				</div>
			</div>
		</div>
	);
}
