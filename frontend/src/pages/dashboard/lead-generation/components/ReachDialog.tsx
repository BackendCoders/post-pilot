'use client';

import { useState, useMemo } from 'react';
import {
	X,
	MessageSquare,
	ExternalLink,
	Copy,
	Check,
	AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMessageTemplates } from '@/query/messageTemplate.query';
import { useAuth } from '@/query/auth.query';
import type { ILead } from '@/type.d';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	selectedLeads: ILead[];
	category?: string;
};

type Step = 'select-template' | 'preview-message' | 'confirm-send';

const TEMPLATE_VAR_REGEX = /\{\{(\w+)\}\}/g;

const getUnresolvedVariables = (content: string): string[] => {
	const matches = content.match(TEMPLATE_VAR_REGEX);
	if (!matches) return [];
	return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
};

const ALWAYS_AVAILABLE = new Set([
	'userName',
	'userEmail',
	'date',
	'time',
	'day',
	'month',
	'year',
	'index',
	'totalLeads',
	'unsubscribeUrl',
]);

const getMissingVariables = (content: string, lead: ILead): string[] => {
	const allVars = getUnresolvedVariables(content);
	return allVars.filter((v) => {
		if (ALWAYS_AVAILABLE.has(v)) return false;

		const leadValue = (lead as Record<string, unknown>)[v];
		return !leadValue && leadValue !== 0 && leadValue !== false;
	});
};

export default function ReachDialog({ isOpen, onClose, selectedLeads }: Props) {
	const [step, setStep] = useState<Step>('select-template');
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [showWarningDialog, setShowWarningDialog] = useState(false);
	const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

	const { data: templatesResponse } = useMessageTemplates();
	const { data: authUser } = useAuth();

	const templates = templatesResponse?.data || [];
	const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);

	const leadsWithPhone = selectedLeads.filter((lead) => lead.phone);

	const generateResolvedMessage = (lead: ILead, template: IMessageTemplate) => {
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
			totalLeads: selectedLeads.length.toString(),
			unsubscribeUrl: '',
		};

		return template.content.replace(
			TEMPLATE_VAR_REGEX,
			(match, key) => replacements[key] ?? match,
		);
	};

	const resolvedMessage = useMemo(() => {
		if (!selectedTemplate || selectedLeads.length === 0) return '';
		return generateResolvedMessage(selectedLeads[0], selectedTemplate);
	}, [selectedTemplate, selectedLeads]);

	const formatPhoneForUrl = (phone: string) => {
		return phone.replace(/[^0-9]/g, '');
	};

	const openWhatsApp = (lead: ILead) => {
		if (!selectedTemplate || !lead.phone) return;
		const message = generateResolvedMessage(lead, selectedTemplate);
		const encodedMessage = encodeURIComponent(message);
		const url = `https://wa.me/${formatPhoneForUrl(lead.phone)}?text=${encodedMessage}`;
		window.open(url, '_blank');
	};

	const handleSendAll = () => {
		selectedLeads.forEach((lead) => {
			if (lead.phone) {
				openWhatsApp(lead);
			}
		});
		onClose();
		handleReset();
	};

	const handleCopyMessage = () => {
		navigator.clipboard.writeText(resolvedMessage);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleReset = () => {
		setSelectedTemplateId(null);
		setStep('select-template');
	};

	const handleClose = () => {
		setShowWarningDialog(false);
		setPendingTemplateId(null);
		onClose();
	};

	const handleTemplateSelect = (templateId: string) => {
		const template = templates.find((t) => t._id === templateId);
		if (!template || !template.content) {
			setSelectedTemplateId(templateId);
			setStep('preview-message');
			return;
		}

		const lead = selectedLeads[0];
		const missing = getMissingVariables(template.content, lead || {});

		if (missing.length > 0) {
			setPendingTemplateId(templateId);
			setShowWarningDialog(true);
		} else {
			setSelectedTemplateId(templateId);
			setStep('preview-message');
		}
	};

	const handleWarningConfirm = () => {
		setSelectedTemplateId(pendingTemplateId);
		setStep('preview-message');
		setShowWarningDialog(false);
		setPendingTemplateId(null);
	};

	const pendingTemplate = templates.find((t) => t._id === pendingTemplateId);
	const missingVars = pendingTemplate?.content
		? getMissingVariables(pendingTemplate.content, selectedLeads[0] || {})
		: [];

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm'>
			<div className='bg-card w-full max-w-md rounded-[28px] shadow-2xl border border-border overflow-hidden'>
				<div className='flex items-center justify-between px-6 pt-6 pb-4'>
					<div>
						<h2 className='text-xl font-semibold tracking-tight'>
							{step === 'select-template'
								? 'Select Template'
								: step === 'preview-message'
									? 'Preview Message'
									: 'Confirm Send'}
						</h2>
						<p className='text-sm text-muted-foreground mt-0.5'>
							{step === 'select-template'
								? `${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} selected`
								: selectedTemplate?.title}
						</p>
					</div>
					<button
						onClick={handleClose}
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
										>
											Create one
										</a>
									</p>
								</div>
							) : (
								<div className='space-y-2 max-h-64 overflow-y-auto'>
									{templates.map((template) => {
										const missingVars = template.content
											? getMissingVariables(
													template.content,
													selectedLeads[0] || {},
												)
											: [];
										return (
											<button
												key={template._id}
												onClick={() => handleTemplateSelect(template._id!)}
												className={`w-full text-left p-4 rounded-xl border transition-all ${
													selectedTemplateId === template._id
														? 'border-primary bg-primary/5'
														: 'border-border hover:border-primary/40 hover:bg-muted/50'
												}`}
											>
												<div className='flex items-start justify-between gap-2'>
													<div className='font-medium text-sm'>
														{template.title}
													</div>
													{missingVars.length > 0 && (
														<AlertTriangle
															size={16}
															className='text-amber-500 shrink-0 mt-0.5'
															title={`Missing: ${missingVars.join(', ')}`}
														/>
													)}
												</div>
												{template.description && (
													<div className='text-xs text-muted-foreground mt-1'>
														{template.description}
													</div>
												)}
												{selectedTemplateId === template._id &&
													template.content && (
														<div className='mt-3 pt-3 border-t border-border/50'>
															<div className='text-[10px] font-semibold text-muted-foreground uppercase mb-1.5'>
																Template Preview
															</div>
															<div className='text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-24 overflow-hidden'>
																{template.content.slice(0, 200)}
																{template.content.length > 200 && '...'}
															</div>
														</div>
													)}
											</button>
										);
									})}
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
								<div className='flex items-center justify-between mb-2'>
									<span className='text-[10px] font-bold text-muted-foreground uppercase'>
										Preview
									</span>
									<button
										onClick={handleCopyMessage}
										className='text-muted-foreground hover:text-foreground transition-colors'
										title='Copy message'
									>
										{copied ? (
											<Check
												size={14}
												className='text-green-500'
											/>
										) : (
											<Copy size={14} />
										)}
									</button>
								</div>
								<div className='text-sm leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto'>
									{resolvedMessage}
								</div>
							</div>

							<div className='bg-green-500/10 border border-green-500/20 rounded-xl p-4'>
								<div className='flex items-center gap-3'>
									<div className='p-2 bg-green-500 rounded-full'>
										<MessageSquare size={16} className='text-white' />
									</div>
									<div className='flex-1'>
										<div className='text-sm font-medium'>Send via WhatsApp</div>
										<div className='text-xs text-muted-foreground'>
											{leadsWithPhone.length} of {selectedLeads.length} leads have phone numbers
										</div>
									</div>
								</div>
							</div>

							{leadsWithPhone.length === 0 && (
								<p className='text-xs text-center text-red-500'>
									No leads with phone numbers available
								</p>
							)}

							<div className='flex justify-between pt-2'>
								<Button
									variant='ghost'
									onClick={handleReset}
									className='rounded-xl'
								>
									Back
								</Button>
								<Button
									onClick={() => setStep('confirm-send')}
									disabled={leadsWithPhone.length === 0}
									className='rounded-xl gap-2 bg-green-500 hover:bg-green-600'
								>
									Continue
								</Button>
							</div>
						</>
					)}

					{step === 'confirm-send' && (
						<>
							<div className='bg-muted/50 rounded-xl p-4 border border-border/50'>
								<div className='flex items-center justify-between mb-2'>
									<span className='text-[10px] font-bold text-muted-foreground uppercase'>
										{selectedLeads.length === 1 ? 'Message' : 'Sample Message'}
									</span>
									<button
										onClick={handleCopyMessage}
										className='text-muted-foreground hover:text-foreground transition-colors'
										title='Copy message'
									>
										{copied ? (
											<Check
												size={14}
												className='text-green-500'
											/>
										) : (
											<Copy size={14} />
										)}
									</button>
								</div>
								<div className='text-sm leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto'>
									{resolvedMessage}
								</div>
							</div>

							<div className='space-y-3'>
								<div className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
									Leads to reach
								</div>

								{selectedLeads.length === 1 && selectedLeads[0] ? (
									<div className='space-y-2'>
										<div className='text-sm font-medium'>
											{selectedLeads[0].title || 'Unnamed Lead'}
										</div>
										{selectedLeads[0].phone && (
											<div className='text-xs text-muted-foreground'>
												Phone: {selectedLeads[0].phone}
											</div>
										)}
									</div>
								) : (
									<div className='text-sm text-muted-foreground'>
										{leadsWithPhone.length} leads will receive this message via WhatsApp
									</div>
								)}
							</div>

							<div className='flex gap-2 pt-2'>
								<Button
									variant='ghost'
									onClick={() => setStep('preview-message')}
									className='flex-1 rounded-xl'
								>
									Back
								</Button>
								<Button
									onClick={handleSendAll}
									className='flex-1 rounded-xl gap-2 bg-green-500 hover:bg-green-600'
								>
									{selectedLeads.length === 1 ? 'Send' : 'Send to All'}
									<ExternalLink size={14} />
								</Button>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Warning Dialog */}
			{showWarningDialog && (
				<div className='fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm'>
					<div className='bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-amber-500/30 overflow-hidden'>
						<div className='p-6 space-y-4'>
							<div className='flex items-center gap-3'>
								<div className='p-3 bg-amber-500/10 rounded-full'>
									<AlertTriangle
										size={24}
										className='text-amber-500'
									/>
								</div>
								<div>
									<h3 className='font-semibold'>Unresolved Variables</h3>
									<p className='text-sm text-muted-foreground'>
										This template contains placeholders that may not be filled
									</p>
								</div>
							</div>

							<div className='bg-muted/50 rounded-xl p-3'>
								<div className='text-xs font-semibold text-muted-foreground uppercase mb-2'>
									Missing lead data:
								</div>
								<div className='flex flex-wrap gap-1.5'>
									{missingVars.map((v) => (
										<span
											key={v}
											className='text-xs px-2 py-1 bg-amber-500/10 text-amber-600 rounded-md border border-amber-500/20'
										>
											{v}
										</span>
									))}
								</div>
							</div>

							<p className='text-sm text-muted-foreground'>
								These fields are not available for the selected lead and will
								appear as{' '}
								<code className='text-xs bg-muted px-1 rounded'>{`{{variable}}`}</code>{' '}
								in the message.
							</p>
						</div>

						<div className='flex gap-2 p-4 border-t border-border bg-muted/20'>
							<Button
								variant='ghost'
								onClick={() => {
									setShowWarningDialog(false);
									setPendingTemplateId(null);
								}}
								className='flex-1 rounded-xl'
							>
								Cancel
							</Button>
							<Button
								onClick={handleWarningConfirm}
								className='flex-1 rounded-xl bg-amber-500 hover:bg-amber-600'
							>
								Proceed Anyway
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
