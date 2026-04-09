import { cn } from '@/lib/utils';
import type { LeadViewMode } from './leadWorkspace.constants';

type Props = {
	value: LeadViewMode;
	onChange: (value: LeadViewMode) => void;
};

export default function LeadWorkspaceToggle({ value, onChange }: Props) {
	return (
		<div className='inline-flex items-center bg-muted rounded-full p-1 border border-border shadow-sm'>
			<button
				type='button'
				onClick={() => onChange('kanban')}
				className={cn(
					'px-4 py-1.5 text-xs font-semibold rounded-full transition-all',
					value === 'kanban'
						? 'bg-background text-foreground shadow'
						: 'text-muted-foreground hover:text-foreground',
				)}
			>
				Kanban
			</button>
			<button
				type='button'
				onClick={() => onChange('list')}
				className={cn(
					'px-4 py-1.5 text-xs font-semibold rounded-full transition-all',
					value === 'list'
						? 'bg-background text-foreground shadow'
						: 'text-muted-foreground hover:text-foreground',
				)}
			>
				List
			</button>
		</div>
	);
}
