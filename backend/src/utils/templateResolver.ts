import { ILead } from '../modules/LeadGeneration/model/lead.model';

interface IUserProfile {
	userName: string;
	email: string;
}

interface ITemplateOptions {
	index?: number;
	totalLeads?: number;
	unsubscribeUrl?: string;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
	month: 'long',
	day: 'numeric',
	year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
	hour: 'numeric',
	minute: '2-digit',
	hour12: true,
});

export const resolveTemplate = (
	template: string,
	lead: ILead,
	user: IUserProfile,
	options: ITemplateOptions = {}
): string => {
	if (!template) return '';

	const now = new Date();

	const replacements: Record<string, string | number> = {
		title: lead.title || '',
		phone: lead.phone || '',
		website: lead.website || '',
		address: lead.address || '',
		googleMapUrl: lead.googleMapUrl || '',
		rating: lead.rating ?? '',
		ratingCount: lead.ratingCount ?? '',
		position: lead.position ?? '',
		userName: user.userName || '',
		userEmail: user.email || '',
		date: DATE_FORMATTER.format(now),
		time: TIME_FORMATTER.format(now),
		day: now.toLocaleDateString('en-US', { weekday: 'long' }),
		month: now.toLocaleDateString('en-US', { month: 'long' }),
		year: now.getFullYear(),
		index: options.index ?? '',
		totalLeads: options.totalLeads ?? '',
		unsubscribeUrl: options.unsubscribeUrl || '',
	};

	let resolved = template;
	for (const [key, value] of Object.entries(replacements)) {
		const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
		resolved = resolved.replace(pattern, String(value));
	}

	return resolved;
};
