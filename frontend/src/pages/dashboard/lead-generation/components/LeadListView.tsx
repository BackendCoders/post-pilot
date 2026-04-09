import { Building2, CheckSquare, MapPin, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusLabel } from './leadWorkspace.constants';

type Props = {
	leads: ILead[];
	selectedLeadIds: Set<string>;
	isLoading: boolean;
	onToggleLeadSelection: (id: string) => void;
	onOpenLead: (lead: ILead) => void;
};

export default function LeadListView({
	leads,
	selectedLeadIds,
	isLoading,
	onToggleLeadSelection,
	onOpenLead,
}: Props) {
	if (isLoading) {
		return (
			<div className='h-full flex items-center justify-center text-muted-foreground'>
				Loading leads...
			</div>
		);
	}

	if (!leads.length) {
		return (
			<div className='h-full flex flex-col items-center justify-center opacity-40'>
				<Building2
					size={48}
					className='mb-4'
				/>
				<p>No leads found</p>
			</div>
		);
	}

	return (
		<div className='h-full overflow-y-auto divide-y divide-border/50'>
			{leads.map((lead) => {
				const id = lead._id || '';
				if (!id) return null;

				return (
					<div
						key={id}
						className={cn(
							'group flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:bg-muted/30 cursor-pointer',
							selectedLeadIds.has(id) && 'bg-primary/4',
						)}
						onClick={() => onOpenLead(lead)}
					>
						<button
							type='button'
							onClick={(event) => {
								event.stopPropagation();
								onToggleLeadSelection(id);
							}}
							className='shrink-0'
						>
							{selectedLeadIds.has(id) ? (
								<CheckSquare className='w-5 h-5 text-primary' />
							) : (
								<Square className='w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground' />
							)}
						</button>

						{lead.thumbnailUrl && (
							<img
								src={lead.thumbnailUrl}
								alt={lead.title}
								draggable={false}
								className='shrink-0 w-14 h-14 rounded-lg object-cover border border-border'
							/>
						)}

						<div className='flex-1 min-w-0'>
							<div className='mb-1 flex items-center gap-3'>
								<h3 className='font-semibold text-base truncate group-hover:text-primary transition-colors'>
									{lead.title}
								</h3>
								<span className='rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
									{getStatusLabel(String(lead.status))}
								</span>
							</div>
							{lead.address && (
								<div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
									<MapPin
										size={13}
										className='text-primary/50'
									/>
									{lead.address}
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
