import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	ArrowLeft,
	ExternalLink,
	Globe,
	MapPin,
	Phone,
	Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLead } from '@/query/leads.query';

const getStatusLabel = (status: string | undefined) => {
	const normalized = String(status || '').toLowerCase();
	if (normalized === 'converted') return 'Complete';
	if (normalized === 'processed') return 'Processed';
	if (normalized === 'rejected') return 'Rejected';
	return 'Saved';
};

export default function LeadBriefAnalysisPage() {
	const navigate = useNavigate();
	const params = useParams();
	const leadId = params.leadId;

	const { data, isLoading } = useLead(leadId);
	const lead = data?.data;

	const createdAtLabel = useMemo(() => {
		if (!lead?.createdAt) return '-';
		return new Date(lead.createdAt).toLocaleString();
	}, [lead?.createdAt]);

	if (isLoading) {
		return (
			<div className='rounded-2xl border border-border bg-card p-8'>
				<p className='text-sm text-muted-foreground'>Loading lead analysis...</p>
			</div>
		);
	}

	if (!lead) {
		return (
			<div className='space-y-4 rounded-2xl border border-border bg-card p-8'>
				<h1 className='text-xl font-semibold'>Lead Not Found</h1>
				<p className='text-sm text-muted-foreground'>
					We could not find this lead. It may have been removed.
				</p>
				<Button
					variant='outline'
					onClick={() => navigate(-1)}
				>
					<ArrowLeft
						size={16}
						className='mr-2'
					/>
					Go Back
				</Button>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between gap-3'>
				<Button
					variant='outline'
					onClick={() => navigate(-1)}
				>
					<ArrowLeft
						size={16}
						className='mr-2'
					/>
					Back
				</Button>
				{lead.googleMapUrl && (
					<Button asChild>
						<a
							href={lead.googleMapUrl}
							target='_blank'
							rel='noopener noreferrer'
						>
							Open On Google Maps
							<ExternalLink
								size={14}
								className='ml-2'
							/>
						</a>
					</Button>
				)}
			</div>

			<div className='rounded-2xl border border-border bg-card p-6'>
				<div className='flex flex-col gap-5 md:flex-row md:items-start'>
					{lead.thumbnailUrl && (
						<img
							src={lead.thumbnailUrl}
							alt={lead.title || 'Lead'}
							className='h-36 w-56 rounded-xl border border-border object-cover'
						/>
					)}
					<div className='flex-1 space-y-3'>
						<h1 className='text-2xl font-semibold'>
							{lead.title || 'Untitled Lead'}
						</h1>
						<div className='flex flex-wrap items-center gap-2 text-xs'>
							<span className='rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary'>
								Status: {getStatusLabel(String(lead.status))}
							</span>
							<span className='rounded-full bg-muted px-3 py-1 font-semibold text-muted-foreground'>
								Created: {createdAtLabel}
							</span>
						</div>
						{lead.address && (
							<div className='flex items-start gap-2 text-sm text-muted-foreground'>
								<MapPin
									size={16}
									className='mt-0.5'
								/>
								<span>{lead.address}</span>
							</div>
						)}
						<div className='flex flex-wrap gap-4 text-sm'>
							{lead.phone && (
								<a
									href={`tel:${lead.phone}`}
									className='inline-flex items-center gap-1.5 text-primary hover:underline'
								>
									<Phone size={14} />
									{lead.phone}
								</a>
							)}
							{lead.website && (
								<a
									href={lead.website}
									target='_blank'
									rel='noopener noreferrer'
									className='inline-flex items-center gap-1.5 text-primary hover:underline'
								>
									<Globe size={14} />
									Visit Website
								</a>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
				<div className='rounded-2xl border border-border bg-card p-5'>
					<p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
						Rating
					</p>
					<p className='mt-2 flex items-center gap-1 text-lg font-semibold'>
						<Star
							size={16}
							className='text-amber-500'
						/>
						{lead.rating ?? '-'}
					</p>
				</div>
				<div className='rounded-2xl border border-border bg-card p-5'>
					<p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
						Rating Count
					</p>
					<p className='mt-2 text-lg font-semibold'>{lead.ratingCount ?? '-'}</p>
				</div>
				<div className='rounded-2xl border border-border bg-card p-5'>
					<p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
						Latitude
					</p>
					<p className='mt-2 text-lg font-semibold'>{lead.latitude ?? '-'}</p>
				</div>
				<div className='rounded-2xl border border-border bg-card p-5'>
					<p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
						Longitude
					</p>
					<p className='mt-2 text-lg font-semibold'>{lead.longitude ?? '-'}</p>
				</div>
			</div>
		</div>
	);
}
