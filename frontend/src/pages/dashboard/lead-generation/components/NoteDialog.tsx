'use client';

import { useState, useEffect } from 'react';
import { X, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateLeadNote } from '@/query/leads.query';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	lead: ILead | null;
};

export default function NoteDialog({ isOpen, onClose, lead }: Props) {
	const [note, setNote] = useState('');
	const updateNoteMutation = useUpdateLeadNote();

	useEffect(() => {
		if (lead?.note) {
			setNote(lead.note);
		} else {
			setNote('');
		}
	}, [lead, isOpen]);

	const handleSave = async () => {
		if (!lead?._id) return;
		await updateNoteMutation.mutateAsync({ leadId: lead._id, note });
		onClose();
	};

	const handleDelete = async () => {
		if (!lead?._id) return;
		await updateNoteMutation.mutateAsync({ leadId: lead._id, note: '' });
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center'>
			<div
				className='absolute inset-0 bg-black/50'
				onClick={onClose}
			/>
			<div className='relative z-10 w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl mx-4'>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center gap-2'>
						<Pencil size={18} />
						<h2 className='text-lg font-semibold'>
							{lead?.note ? 'Edit Note' : 'Add Note'}
						</h2>
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

				<Textarea
					value={note}
					onChange={(e) => setNote(e.target.value)}
					placeholder='Write your note here...'
					className='min-h-[150px] resize-none rounded-xl'
					autoFocus
				/>

				<div className='mt-4 flex items-center justify-between'>
					{lead?.note ? (
						<Button
							variant='ghost'
							onClick={handleDelete}
							disabled={updateNoteMutation.isPending}
							className='text-muted-foreground hover:text-destructive'
						>
							<Trash2 size={16} className='mr-2' />
							Delete
						</Button>
					) : (
						<div />
					)}
					<div className='flex gap-2'>
						<Button variant='outline' onClick={onClose}>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={updateNoteMutation.isPending}
						>
							{updateNoteMutation.isPending && (
								<Loader2
									size={16}
									className='mr-2 animate-spin'
								/>
							)}
							Save
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}