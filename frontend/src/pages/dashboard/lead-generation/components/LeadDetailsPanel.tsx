import { Globe, MapPin, Phone, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getStatusLabel } from './leadWorkspace.constants';

type Props = {
	lead: ILead | null;
	onClose: () => void;
};

export default function LeadDetailsPanel({ lead, onClose }: Props) {
	const navigate = useNavigate();

	if (!lead) return null;

	return (
		<div className='absolute right-0 top-0 z-30 h-full w-full max-w-lg border-l border-border bg-background shadow-2xl'>
			<div className='h-full overflow-y-auto'>
				<div className='sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur'>
					<h3 className='text-base font-semibold'>Lead Details</h3>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						className='rounded-full'
					>
						<X size={16} />
					</Button>
				</div>

				<div className='space-y-6 p-6'>
					{lead.thumbnailUrl && (
						<img
							src={lead.thumbnailUrl}
							alt={lead.title || 'Lead'}
							className='h-52 w-full rounded-xl object-cover border border-border'
						/>
					)}

					<div>
						<h2 className='text-xl font-semibold'>
							{lead.title || 'Untitled Lead'}
						</h2>
						<p className='mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground'>
							Status: {getStatusLabel(String(lead.status))}
						</p>
					</div>

					<div className='space-y-3 text-sm'>
						{lead.address && (
							<div className='flex items-start gap-2 text-muted-foreground'>
								<MapPin
									size={16}
									className='mt-0.5 shrink-0'
								/>
								<span>{lead.address}</span>
							</div>
						)}

						{lead.phone && (
							<a
								href={`tel:${lead.phone}`}
								className='flex items-center gap-2 text-primary hover:underline'
							>
								<Phone size={16} />
								{lead.phone}
							</a>
						)}

						{lead.website && (
							<a
								href={lead.website}
								target='_blank'
								rel='noopener noreferrer'
								className='flex items-center gap-2 text-primary hover:underline'
							>
								<Globe size={16} />
								Visit website
							</a>
						)}
					</div>

					<div className='grid grid-cols-2 gap-3 text-sm'>
						<div className='rounded-xl border border-border p-4'>
							<p className='text-xs uppercase tracking-wider text-muted-foreground'>
								Rating
							</p>
							<p className='mt-2 flex items-center gap-1.5 font-semibold'>
								<Star
									size={14}
									className='text-amber-500'
								/>
								{lead.rating ?? '-'}
							</p>
						</div>
						<div className='rounded-xl border border-border p-4'>
							<p className='text-xs uppercase tracking-wider text-muted-foreground'>
								Rating Count
							</p>
							<p className='mt-2 font-semibold'>{lead.ratingCount ?? '-'}</p>
						</div>
						<div className='rounded-xl border border-border p-4'>
							<p className='text-xs uppercase tracking-wider text-muted-foreground'>
								Latitude
							</p>
							<p className='mt-2 font-semibold'>{lead.latitude ?? '-'}</p>
						</div>
						<div className='rounded-xl border border-border p-4'>
							<p className='text-xs uppercase tracking-wider text-muted-foreground'>
								Longitude
							</p>
							<p className='mt-2 font-semibold'>{lead.longitude ?? '-'}</p>
						</div>
					</div>

					<Button
						variant='outline'
						className='w-full rounded-xl'
						onClick={() => {
							if (!lead._id) return;
							navigate(`/dashboard/lead-generation/brief-analysis/${lead._id}`);
						}}
					>
						Brief Analysis
					</Button>
					{lead.googleMapUrl && (
						<Button
							asChild
							variant={'link'}
							className='w-full rounded-xl'
						>
							<a
								href={lead.googleMapUrl}
								target='_blank'
								rel='noopener noreferrer'
							>
								Open Google Maps
							</a>
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
