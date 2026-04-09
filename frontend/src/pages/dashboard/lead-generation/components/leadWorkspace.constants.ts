export type LeadViewMode = 'kanban' | 'list';

export type LeadStatusValue = 'saved' | 'processed' | 'converted' | 'rejected';

export type LeadColumn = {
	id: string;
	title: string;
	status: LeadStatusValue;
};

export const LEAD_COLUMNS: LeadColumn[] = [
	{ id: 'col-saved', title: 'Saved', status: 'saved' },
	{ id: 'col-processed', title: 'Processed', status: 'processed' },
	{ id: 'col-complete', title: 'Complete', status: 'converted' },
	{ id: 'col-rejected', title: 'Rejected', status: 'rejected' },
];

export const statusFromColumnId = (columnId: string): LeadStatusValue | null => {
	const column = LEAD_COLUMNS.find((item) => item.id === columnId);
	return column ? column.status : null;
};

export const getStatusLabel = (status: string) => {
	const normalized = String(status).toLowerCase();
	if (normalized === 'converted') return 'Complete';
	if (normalized === 'processed') return 'Processed';
	if (normalized === 'rejected') return 'Rejected';
	return 'Saved';
};
