import { useCallback, useMemo, useState } from 'react';
import { CheckSquare, Square, Notebook } from 'lucide-react';
import { Kanban, type BoardData } from 'react-kanban-kit';
import { LEAD_COLUMNS, statusFromColumnId } from './leadWorkspace.constants';
import { cn } from '@/lib/utils';
import NoteDialog from './NoteDialog';

type Props = {
	leads: ILead[];
	selectedLeadIds: Set<string>;
	isLoading: boolean;
	onToggleLeadSelection: (id: string) => void;
	onToggleColumnSelection: (ids: string[]) => void;
	onOpenLead: (lead: ILead) => void;
	onMoveLeads: (
		ids: string[],
		status: 'saved' | 'processed' | 'converted' | 'rejected',
	) => void;
};

const getCardId = (leadId: string) => `lead-${leadId}`;

const getLeadIdFromCard = (cardId: string) => cardId.replace(/^lead-/, '');

export default function LeadKanbanBoard({
	leads,
	selectedLeadIds,
	isLoading,
	onToggleLeadSelection,
	onToggleColumnSelection,
	onOpenLead,
	onMoveLeads,
}: Props) {
	const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
	const [noteLead, setNoteLead] = useState<ILead | null>(null);

	const leadsByStatus = useMemo(() => {
		const map = new Map<string, ILead[]>();
		for (const column of LEAD_COLUMNS) {
			map.set(column.status, []);
		}

		for (const lead of leads) {
			const key = String(lead.status).toLowerCase();
			if (!map.has(key)) continue;
			map.set(key, [...(map.get(key) || []), lead]);
		}

		return map;
	}, [leads]);

	const getColumnLeadIds = useCallback(
		(columnId: string) => {
			const status = statusFromColumnId(columnId);
			if (!status) return [];
			return (leadsByStatus.get(status) || [])
				.map((lead) => lead._id)
				.filter((id): id is string => Boolean(id));
		},
		[leadsByStatus],
	);

	const leadById = useMemo(() => {
		const map = new Map<string, ILead>();
		for (const lead of leads) {
			if (lead._id) map.set(lead._id, lead);
		}
		return map;
	}, [leads]);

	const dataSource = useMemo<BoardData>(() => {
		const board: BoardData = {
			root: {
				id: 'root',
				title: 'Leads Board',
				parentId: null,
				children: LEAD_COLUMNS.map((column) => column.id),
				totalChildrenCount: LEAD_COLUMNS.length,
			},
		};

		for (const column of LEAD_COLUMNS) {
			const columnLeads = leadsByStatus.get(column.status) || [];
			const children = columnLeads
				.map((lead) => lead._id)
				.filter((id): id is string => Boolean(id))
				.map(getCardId);

			board[column.id] = {
				id: column.id,
				title: column.title,
				parentId: 'root',
				children,
				totalChildrenCount: children.length,
			};

			for (const lead of columnLeads) {
				if (!lead._id) continue;
				const cardId = getCardId(lead._id);
				board[cardId] = {
					id: cardId,
					parentId: column.id,
					title: lead.title || 'Untitled Lead',
					type: 'lead-card',
					children: [],
					totalChildrenCount: 0,
					content: {
						leadId: lead._id,
						thumbnailUrl: lead.thumbnailUrl,
						note: lead.note,
						status: lead.status,
						messageCount: lead.messageCount,
					},
				};
			}
		}

		return board;
	}, [leadsByStatus]);

	const configMap = useMemo(
		() => ({
			'lead-card': {
				isDraggable: true,
				render: ({
					data,
				}: {
					data: {
						id: string;
						title: string;
						content?: {
							leadId?: string;
							thumbnailUrl?: string;
							note?: string;
							status?: string;
							messageCount?: number;
						};
					};
				}) => {
					const leadId = data.content?.leadId || getLeadIdFromCard(data.id);
					const isSelected = selectedLeadIds.has(leadId);
					const hasNote = !!data.content?.note;
					const isConverted = data.content?.status === 'converted';
					const messageCount = data.content?.messageCount || 0;

					const handleNoteClick = (event: React.MouseEvent) => {
						event.stopPropagation();
						const lead = leadById.get(leadId);
						if (lead) {
							setNoteLead(lead);
							setIsNoteDialogOpen(true);
						}
					};

					return (
						<div
							className={cn(
								'group relative flex flex-col gap-2 rounded-xl border bg-card p-2.5 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]',
								isConverted
									? 'border-green-500/30 bg-green-500/2 dark:border-green-500/50'
									: 'border-border',
							)}
						>
							{/* Header Actions */}
							<div className='flex items-center justify-between'>
								<button
									type='button'
									onClick={(event) => {
										event.stopPropagation();
										onToggleLeadSelection(leadId);
									}}
									className='group/checkbox flex items-center gap-1.5 outline-none'
								>
									<div className='relative flex items-center justify-center'>
										{isSelected ? (
											<CheckSquare className='h-4 w-4 text-primary transition-transform duration-200 group-active/checkbox:scale-90' />
										) : (
											<Square className='h-4 w-4 text-muted-foreground transition-colors group-hover/checkbox:text-foreground' />
										)}
									</div>
								</button>
								{messageCount > 0 && (
									<span
										title={`Messages Sent: ${messageCount}`}
										className='absolute right-2 top-3.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground'
									>
										{messageCount}
									</span>
								)}

								{(hasNote || messageCount > 0) && (
									<button
										type='button'
										onClick={handleNoteClick}
										className={cn(
											'inline-flex mr-5 items-center justify-center rounded-md p-1 transition-all duration-200 hover:bg-background border border-transparent hover:border-border',
											hasNote
												? 'opacity-100 text-primary'
												: 'opacity-0 group-hover:opacity-100 text-muted-foreground',
										)}
										title={hasNote ? data.content?.note : 'Add note'}
									>
										<Notebook
											size={14}
											className='transition-colors'
										/>
									</button>
								)}
							</div>

							{/* Media Content */}
							{data.content?.thumbnailUrl && (
								<div className='overflow-hidden rounded-lg border border-border/50'>
									<img
										src={data.content.thumbnailUrl}
										alt={data.title}
										draggable={false}
										className='h-20 w-full select-none object-cover transition-transform duration-500 group-hover:scale-105'
									/>
								</div>
							)}

							{/* Typography */}
							<div className='space-y-1'>
								<p className='line-clamp-2 font-sans text-sm font-medium leading-tight tracking-tight text-foreground'>
									{data.title}
								</p>
							</div>
						</div>
					);
				},
			},
		}),
		[onToggleLeadSelection, selectedLeadIds, leadById],
	);

	if (isLoading) {
		return (
			<div className='h-full flex items-center justify-center text-muted-foreground'>
				Loading leads...
			</div>
		);
	}

	return (
		<div className='relative h-full'>
			<div className='h-full w-full overflow-x-auto overflow-y-auto scrollbar-hide'>
				<div className='h-full min-w-[1160px]'>
					<Kanban
						dataSource={dataSource}
						configMap={configMap}
						virtualization={false}
						rootClassName='h-full min-w-[1160px]'
						onCardClick={(_, card) => {
							const leadId = card.content?.leadId || getLeadIdFromCard(card.id);
							const lead = leadById.get(leadId);
							if (lead) onOpenLead(lead);
						}}
						onCardMove={({ cardId, toColumnId }) => {
							const targetStatus = statusFromColumnId(toColumnId);
							if (!targetStatus) return;

							const draggedLeadId = getLeadIdFromCard(cardId);
							const draggedLead = leadById.get(draggedLeadId);
							if (!draggedLead || !draggedLead._id) return;

							const moveMany =
								selectedLeadIds.has(draggedLead._id) &&
								selectedLeadIds.size > 1;
							if (moveMany) {
								const ids = leads
									.filter(
										(item) =>
											item._id &&
											selectedLeadIds.has(item._id) &&
											String(item.status).toLowerCase() !== targetStatus,
									)
									.map((item) => item._id as string);

								if (ids.length) onMoveLeads(ids, targetStatus);
								return;
							}

							if (String(draggedLead.status).toLowerCase() !== targetStatus) {
								onMoveLeads([draggedLead._id], targetStatus);
							}
						}}
						renderColumnHeader={(column) => (
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<button
										type='button'
										onClick={(event) => {
											event.stopPropagation();
											onToggleColumnSelection(getColumnLeadIds(column.id));
										}}
										className='rounded-full p-0.5 text-muted-foreground hover:text-primary transition-colors'
										title={`Toggle all ${column.title} leads`}
									>
										{(() => {
											const ids = getColumnLeadIds(column.id);
											const allSelected =
												ids.length > 0 &&
												ids.every((id) => selectedLeadIds.has(id));
											return allSelected ? (
												<CheckSquare className='h-4 w-4 text-primary' />
											) : (
												<Square className='h-4 w-4' />
											);
										})()}
									</button>
									<span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
										{column.title}
									</span>
								</div>
								<span className='rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground'>
									{column.totalChildrenCount}
								</span>
							</div>
						)}
						columnWrapperClassName={() => 'min-w-[280px] max-w-[320px]'}
						columnStyle={() => ({ minHeight: 520 })}
						columnListContentStyle={() => ({ padding: 8 })}
					/>
				</div>
			</div>

			<NoteDialog
				isOpen={isNoteDialogOpen}
				onClose={() => setIsNoteDialogOpen(false)}
				lead={noteLead}
			/>
		</div>
	);
}
