'use client';

import { useState } from 'react';
import { X, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMessageTemplates } from '@/query/messageTemplate.query';
import { useAuth } from '@/query/auth.query';
import type { ILead } from '@/type.d';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	lead: ILead;
};

const TEMPLATE_VAR_REGEX = /\{\{(\w+)\}\}/g;

export default function SingleLeadReachDialog({
	isOpen,
	onClose,
	lead,
}: Props) {
	const [step, setStep] = useState<'select-template' | 'preview-message'>('select-template');
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

	const { data: templatesResponse } = useMessageTemplates();
	const { data: authUser } = useAuth();

	const templates = templatesResponse?.data || [];
	const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);

	const generateResolvedMessage = (template: IMessageTemplate) => {
		if (!template?.content) return '';

		const now = new Date();
		const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});

		const replacements: Record<string, string> = {
			userName: authUser?.userName || '',
			userEmail: authUser?.email || '',
			date: DATE_FORMATTER.format(now),
			time: now.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
			}),
			day: now.toLocaleDateString('en-US', { weekday: 'long' }),
			month: now.toLocaleDateString('en-US', { month: 'long' }),
			year: now.getFullYear().toString(),
			title: lead.title || '',
			phone: lead.phone || '',
			website: lead.website || '',
			address: lead.address || '',
			googleMapUrl: lead.googleMapUrl || '',
			rating: lead.rating?.toString() || '',
			ratingCount: lead.ratingCount?.toString() || '',
			position: lead.position?.toString() || '',
			index: '1',
			totalLeads: '1',
			unsubscribeUrl: '',
		};

		return template.content.replace(
			TEMPLATE_VAR_REGEX,
			(match, key) => replacements[key] ?? match,
		);
	};

	const resolvedMessage = selectedTemplate ? generateResolvedMessage(selectedTemplate) : '';

	const handleSendMessage = () => {
		if (!selectedTemplate || !lead.phone) return;

		const message = generateResolvedMessage(selectedTemplate);
		const encodedMessage = encodeURIComponent(message);
		const phone = lead.phone.replace(/[^0-9]/g, '');
		const url = `https://wa.me/${phone}?text=${encodedMessage}`;
		window.open(url, '_blank');
		onClose();
		handleReset();
	};

	const handleReset = () => {
		setStep('select-template');
		setSelectedTemplateId(null);
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm'>
			<div className='bg-card w-full max-w-md rounded-[28px] shadow-2xl border border-border overflow-hidden'>
				<div className='flex items-center justify-between px-6 pt-6 pb-4'>
					<div>
						<h2 className='text-xl font-semibold tracking-tight'>
							{step === 'select-template' ? 'Select Template' : 'Preview Message'}
						</h2>
						<p className='text-sm text-muted-foreground mt-0.5'>
							{step === 'select-template'
								? `Reach ${lead.title || 'Lead'}`
								: selectedTemplate?.title}
						</p>
					</div>
					<button
						onClick={onClose}
						className='p-2 hover:bg-muted rounded-full transition-colors'
					>
						<X size={20} />
					</button>
				</div>

				<div className='p-6 space-y-4'>
					{step === 'select-template' && (
						<>
							{templates.length === 0 ? (
								<div className='text-center py-8'>
									<p className='text-muted-foreground'>
										No templates available.{' '}
										<a
											href='/dashboard/lead-generation/templates'
											className='text-primary hover:underline'
											target='_blank'
											rel='noopener noreferrer'
										>
											Create one
										</a>
									</p>
								</div>
							) : (
								<div className='space-y-2 max-h-72 overflow-y-auto'>
									{templates.map((template) => (
										<button
											key={template._id}
											onClick={() => setSelectedTemplateId(template._id!)}
											className={`w-full text-left p-4 rounded-xl border transition-all ${
												selectedTemplateId === template._id
													? 'border-primary bg-primary/5'
													: 'border-border hover:border-primary/40 hover:bg-muted/50'
											}`}
										>
											<div className='font-medium text-sm'>
												{template.title}
											</div>
											{template.description && (
												<div className='text-xs text-muted-foreground mt-1'>
													{template.description}
												</div>
											)}
										</button>
									))}
								</div>
							)}

							<div className='flex justify-end pt-2'>
								<Button
									onClick={() => setStep('preview-message')}
									disabled={!selectedTemplateId}
									className='rounded-xl'
								>
									Preview
								</Button>
							</div>
						</>
					)}

					{step === 'preview-message' && (
						<>
							<div className='bg-muted/50 rounded-xl p-4 border border-border/50'>
								<div className='text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto'>
									{resolvedMessage}
								</div>
							</div>

							{lead.phone && (
								<div className='text-xs text-muted-foreground text-center'>
									Will be sent to: {lead.phone}
								</div>
							)}

							<div className='flex gap-2 pt-2'>
								<Button
									variant='ghost'
									onClick={handleReset}
									className='flex-1 rounded-xl'
								>
									Back
								</Button>
								<Button
									onClick={handleSendMessage}
									disabled={!lead.phone}
									className='flex-1 rounded-xl gap-2 bg-green-500 hover:bg-green-600'
								>
									Send via WhatsApp
									<ExternalLink size={14} />
								</Button>
							</div>

							{!lead.phone && (
								<p className='text-xs text-center text-red-500 mt-2'>
									No phone number available
								</p>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
