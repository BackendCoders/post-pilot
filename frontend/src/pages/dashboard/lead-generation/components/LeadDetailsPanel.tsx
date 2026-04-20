'use client';

import { useState } from 'react';
import {
	Globe,
	MapPin,
	Phone,
	Star,
	X,
	MessageSquare,
	ExternalLink,
	Pencil,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getStatusLabel } from './leadWorkspace.constants';
import ReachDialog from './ReachDialog';
import NoteDialog from './NoteDialog';

type Props = {
	lead: ILead | null;
	onClose: () => void;
};

export default function LeadDetailsPanel({ lead, onClose }: Props) {
	const navigate = useNavigate();
	const [isReachDialogOpen, setIsReachDialogOpen] = useState(false);
	const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

	if (!lead) return null;

	return (
		<>
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

						{/* Reach Actions */}
						<div className='space-y-3'>
							<p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
								Connect
							</p>
							<button
								onClick={() => setIsReachDialogOpen(true)}
								disabled={!lead.phone}
								title={!lead.phone ? 'Phone number not available' : 'Send message via WhatsApp'}
								className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
									!lead.phone
										? 'opacity-50 cursor-not-allowed border-border bg-muted/30'
										: 'border-border hover:border-green-500/40 hover:bg-green-50 dark:hover:bg-green-500/10'
								}`}
							>
								<div className={`p-2 rounded-full ${!lead.phone ? 'bg-muted' : 'bg-green-500'}`}>
									<MessageSquare size={18} className={!lead.phone ? 'text-muted-foreground' : 'text-white'} />
								</div>
								<div className='text-left'>
									<span className='text-sm font-medium'>Send Message</span>
									<p className='text-[10px] text-muted-foreground'>via WhatsApp</p>
								</div>
							</button>
							{!lead.phone && (
								<p className='text-xs text-center text-red-500'>
									Phone number not available
								</p>
							)}
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
									<ExternalLink size={14} className='ml-2' />
								</a>
							</Button>
						)}

						<div className='space-y-3'>
							<p className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
								Note
							</p>
							<div className='rounded-xl border border-border p-4 min-h-[60px]'>
								{lead.note ? (
									<div className='flex items-start justify-between gap-2'>
										<p className='text-sm whitespace-pre-wrap'>
											{lead.note}
										</p>
										<Button
											variant='ghost'
											size='icon'
											onClick={() => setIsNoteDialogOpen(true)}
											className='h-8 w-8 shrink-0 rounded-lg'
										>
											<Pencil size={14} />
										</Button>
									</div>
								) : (
									<Button
										variant='ghost'
										onClick={() => setIsNoteDialogOpen(true)}
										className='w-full h-auto py-2 text-muted-foreground hover:text-foreground'
									>
										<Pencil size={14} className='mr-2' />
										<span className='text-xs'>Add a note</span>
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			<ReachDialog
				isOpen={isReachDialogOpen}
				onClose={() => setIsReachDialogOpen(false)}
				selectedLeads={[lead]}
			/>

			<NoteDialog
				isOpen={isNoteDialogOpen}
				onClose={() => setIsNoteDialogOpen(false)}
				lead={lead}
			/>
		</>
	);
}
