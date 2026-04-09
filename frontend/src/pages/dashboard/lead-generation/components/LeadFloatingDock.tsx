'use client';

import React from 'react';
import { Download, Trash, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
	selectedCount: number;
	onExport: () => void;
	onClear: () => void;
	onDelete: () => void;
	onMoveToStatus: (
		status: 'saved' | 'processed' | 'converted' | 'rejected',
	) => void;
};

/**
 * LeadFloatingDock - A Material 3 inspired contextual action bar.
 * Refined for the Gemini UI ecosystem.
 */
export default function LeadFloatingDock({
	selectedCount,
	onExport,
	onClear,
	onDelete,
	onMoveToStatus,
}: Props) {
	if (selectedCount <= 0) return null;

	return (
		<div className='fixed bottom-8 left-1/2 z-50 -translate-x-1/2 px-4 w-full max-w-fit'>
			<div
				className={cn(
					'flex items-center gap-2 p-2 pr-4',
					'bg-card border border-border shadow-2xl rounded-3xl',
					'animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out',
				)}
			>
				{/* Selection Indicator Section */}
				<div className='flex items-center gap-3 px-3 py-2 border-r border-border/60'>
					<div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold ring-4 ring-primary/10'>
						{selectedCount}
					</div>
					<span className='text-sm font-medium tracking-tight text-foreground whitespace-nowrap'>
						Selected
					</span>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClear}
						className='h-6 w-6 rounded-full hover:bg-muted transition-all active:scale-90'
						title='Clear selection'
					>
						<X
							size={14}
							className='text-muted-foreground'
						/>
					</Button>
				</div>

				{/* Action Group */}
				<div className='flex items-center gap-1'>
					<ActionButton
						onClick={onExport}
						icon={<Download size={16} />}
					>
						Export
					</ActionButton>

					<div className='h-4 w-px bg-border mx-1' />

					<ActionButton onClick={() => onMoveToStatus('saved')}>
						Save
					</ActionButton>

					<ActionButton onClick={() => onMoveToStatus('processed')}>
						Process
					</ActionButton>

					<ActionButton onClick={() => onMoveToStatus('converted')}>
						Complete
					</ActionButton>

					<div className='h-4 w-px bg-border mx-1' />

					{/* Destructive Action */}
					<Button
						variant='ghost'
						size='icon'
						onClick={onDelete}
						className='h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95'
					>
						<Trash size={18} />
					</Button>
				</div>
			</div>
		</div>
	);
}

/**
 * Reusable Action Button following M3 'Tonal' or 'Ghost' styling
 */
function ActionButton({
	children,
	onClick,
	icon,
}: {
	children: React.ReactNode;
	onClick: () => void;
	icon?: React.ReactNode;
}) {
	return (
		<Button
			variant='ghost'
			onClick={onClick}
			className={cn(
				'h-10 px-4 rounded-xl',
				'text-sm font-medium tracking-tight',
				'hover:bg-muted transition-all duration-200 active:scale-95',
				'flex items-center gap-2',
			)}
		>
			{icon && <span className='opacity-80'>{icon}</span>}
			{children}
		</Button>
	);
}
