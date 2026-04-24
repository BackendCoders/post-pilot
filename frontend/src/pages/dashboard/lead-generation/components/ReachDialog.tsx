'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
	X,
	MessageSquare,
	ExternalLink,
	Copy,
	Check,
	AlertTriangle,
	Loader2,
	Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMessageTemplates } from '@/query/messageTemplate.query';
import { useAuth } from '@/query/auth.query';
import {
	useWhatsappSendMessagebulk,
	useWhatsAppStatus,
} from '@/query/whatsapp.query';
import MessageEditor from './MessageEditor';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	selectedLeads: Partial<ILead>[];
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

const getMissingVariables = (content: string, lead: Partial<ILead>): string[] => {
	const allVars = getUnresolvedVariables(content);
	return allVars.filter((v) => {
		if (ALWAYS_AVAILABLE.has(v)) return false;

		const leadValue = (lead as unknown as Record<string, unknown>)[v];
		return !leadValue && leadValue !== 0 && leadValue !== false;
	});
};

const formatWhatsAppText = (text: string) => {
	if (!text) return null;
	return text.split('\n').map((line, i) => (
		<React.Fragment key={i}>
			{line.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~|```[^`]+```)/g).map((part, j) => {
				if (part.startsWith('```') && part.endsWith('```')) {
					return (
						<code
							key={j}
							className='font-mono bg-black/10 dark:bg-white/10 px-1 rounded text-[13px]'
						>
							{part.slice(3, -3)}
						</code>
					);
				}
				if (part.startsWith('*') && part.endsWith('*')) {
					return (
						<strong
							key={j}
							className='font-semibold'
						>
							{part.slice(1, -1)}
						</strong>
					);
				}
				if (part.startsWith('_') && part.endsWith('_')) {
					return <em key={j}>{part.slice(1, -1)}</em>;
				}
				if (part.startsWith('~') && part.endsWith('~')) {
					return (
						<del
							key={j}
							className='opacity-70'
						>
							{part.slice(1, -1)}
						</del>
					);
				}
				return part;
			})}
			{i < text.split('\n').length - 1 && <br />}
		</React.Fragment>
	));
};

export default function ReachDialog({ isOpen, onClose, selectedLeads }: Props) {
	const [step, setStep] = useState<Step>('select-template');
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
		null,
	);
	const [customContent, setCustomContent] = useState('');
	const [copied, setCopied] = useState(false);
	const [showWarningDialog, setShowWarningDialog] = useState(false);
	const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(
		null,
	);
	const [isSending, setIsSending] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			setStep('select-template');
			setSelectedTemplateId(null);
			setPendingTemplateId(null);
			setShowWarningDialog(false);
			setIsSending(false);
			setCopied(false);
			setCustomContent('');
		}
	}, [isOpen]);

	const { data: templatesResponse } = useMessageTemplates();
	const { data: authUser } = useAuth();
	const { data: whatsappConnectedStatus } = useWhatsAppStatus();
	const { mutateAsync: whatsappSendMessagebulkAsync } =
		useWhatsappSendMessagebulk();

	const templates = templatesResponse?.data || [];
	const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);

	const leadsWithPhone = selectedLeads.filter((lead) => lead.phone);

	const generateResolvedMessage = (lead: Partial<ILead>, content: string) => {
		if (!content) return '';

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

		return content.replace(
			TEMPLATE_VAR_REGEX,
			(match, key) => replacements[key] ?? match,
		);
	};

	const resolvedMessage = useMemo(() => {
		if (!customContent || selectedLeads.length === 0) return '';
		return generateResolvedMessage(selectedLeads[0], customContent);
	}, [customContent, selectedLeads]);

	const formatPhoneForUrl = (phone: string) => {
		return phone.replace(/[^0-9]/g, '');
	};

	const openWhatsApp = async (lead: Partial<ILead>) => {
		if (!customContent || !lead.phone) return;
		const message = generateResolvedMessage(lead, customContent);
		const encodedMessage = encodeURIComponent(message);

		if (whatsappConnectedStatus?.state === 'CONNECTED') {
			await whatsappSendMessagebulkAsync({
				phoneNumbers: [lead.phone],
				message,
			});
		} else {
			const url = `https://wa.me/${formatPhoneForUrl(lead.phone)}?text=${encodedMessage}`;
			window.open(url, '_blank');
		}
	};

	const handleSendAll = async () => {
		setIsSending(true);
		for (const lead of selectedLeads) {
			if (lead.phone) {
				try {
					await openWhatsApp(lead);
				} catch (error) {
					console.error('Failed to send to', lead.phone, error);
				}
			}
		}
		setIsSending(false);
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
		setCustomContent('');
		setStep('select-template');
	};

	const handleClose = () => {
		onClose();
	};

	const handleTemplateSelect = (templateId: string) => {
		const template = templates.find((t) => t._id === templateId);
		if (!template || !template.content) {
			setSelectedTemplateId(templateId);
			setCustomContent('');
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
			setCustomContent(template.content);
			setStep('preview-message');
		}
	};

	const handleWarningConfirm = () => {
		setSelectedTemplateId(pendingTemplateId);
		const template = templates.find((t) => t._id === pendingTemplateId);
		setCustomContent(template?.content || '');
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
		<div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm'>
			<div
				className={`bg-card w-full ${step === 'preview-message' ? 'max-w-4xl' : 'max-w-md'} rounded-[28px] shadow-2xl border border-border flex flex-col max-h-[95vh] overflow-hidden transition-all duration-300 ease-out`}
			>
				<div className='flex items-center justify-between px-6 pt-6 pb-4 shrink-0'>
					<div>
						<h2 className='text-xl font-semibold tracking-tight'>
							{step === 'select-template'
								? 'Select Template'
								: step === 'preview-message'
									? 'Edit & Preview Message'
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

				<div className='p-6 pt-2 space-y-4 overflow-y-auto flex-1'>
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
									onClick={() => {
										const template = templates.find(
											(t) => t._id === selectedTemplateId,
										);
										setCustomContent(template?.content || '');
										setStep('preview-message');
									}}
									disabled={!selectedTemplateId}
									className='rounded-xl'
								>
									Next: Edit Message
								</Button>
							</div>
						</>
					)}

					{step === 'preview-message' && (
						<div className='grid grid-cols-1 md:grid-cols-2 gap-8 h-full'>
							{/* LEFT: Editor */}
							<div className='space-y-4 h-full flex flex-col'>
								<div className='flex items-center justify-between pb-1'>
									<span className='text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
										<div className='w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]'>
											1
										</div>
										Edit Template
									</span>
								</div>
								<div className='flex-1 min-h-0'>
									<MessageEditor
										value={customContent}
										onChange={setCustomContent}
									/>
								</div>
							</div>

							{/* RIGHT: Live Preview & Actions */}
							<div className='space-y-4 flex flex-col h-full bg-muted/10 p-5 rounded-3xl border border-border/50'>
								<div className='flex items-center justify-between pb-1'>
									<span className='text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
										<div className='w-5 h-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center text-[10px]'>
											2
										</div>
										Live Preview
									</span>
									<button
										onClick={handleCopyMessage}
										className='text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-muted rounded-md'
										title='Copy message'
									>
										{copied ? (
											<Check
												size={15}
												className='text-green-500'
											/>
										) : (
											<Copy size={15} />
										)}
									</button>
								</div>

								{/* WhatsApp Mockup Base */}
								<div className='flex-1 min-h-[220px] bg-[#efeae2] dark:bg-[#0b141a] rounded-2xl p-4 overflow-y-auto border border-border/50 relative shadow-inner'>
									{/* Background Pattern Mock */}
									<div
										className='absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none'
										style={{
											backgroundImage:
												'radial-gradient(#000 1px, transparent 1px)',
											backgroundSize: '16px 16px',
										}}
									/>

									<div className='relative flex flex-col gap-2'>
										{/* Chat Bubble */}
										<div className='bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tr-sm p-2.5 pb-2 shadow-sm max-w-[90%] self-end relative min-w-[120px]'>
											<div className='text-[14.5px] leading-[1.4] font-sans break-words pr-2'>
												{resolvedMessage ? (
													formatWhatsAppText(resolvedMessage)
												) : (
													<span className='italic opacity-50'>
														Empty message...
													</span>
												)}
											</div>
											<div className='text-[10px] text-black/40 dark:text-white/40 flex items-center justify-end gap-1 mt-0.5 font-medium float-right clear-both px-1'>
												<span>
													{new Date()
														.toLocaleTimeString([], {
															hour: 'numeric',
															minute: '2-digit',
														})
														.toLowerCase()}
												</span>
												<Check
													size={12}
													className='text-[#53bdeb] ml-0.5 opacity-80'
												/>
											</div>
										</div>
									</div>
								</div>

								<div className='bg-background border border-border shadow-sm rounded-xl p-3 flex items-center gap-3'>
									<div className='p-2 bg-green-500 rounded-full shrink-0 shadow-sm shadow-green-500/20'>
										<MessageSquare
											size={16}
											className='text-white'
										/>
									</div>
									<div className='flex-1'>
										<div className='text-sm font-semibold leading-none'>
											Ready to Send
										</div>
										<div className='text-xs text-muted-foreground mt-1.5 font-medium'>
											{leadsWithPhone.length} of {selectedLeads.length} leads
											selected.
										</div>
									</div>
								</div>

								{leadsWithPhone.length === 0 && (
									<p className='text-xs text-center text-red-500 font-medium'>
										No leads with phone numbers.
									</p>
								)}

								<div className='flex justify-between pt-1 mt-auto gap-4'>
									<Button
										variant='outline'
										onClick={handleReset}
										className='rounded-xl flex-1 font-semibold h-11'
									>
										Cancel
									</Button>
									<Button
										onClick={() => setStep('confirm-send')}
										disabled={leadsWithPhone.length === 0}
										className='rounded-xl flex-1 bg-green-500 hover:bg-green-600 text-white shadow-sm h-11 font-semibold'
									>
										Confirm & Send
									</Button>
								</div>
							</div>
						</div>
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
									<div className='space-y-2'>
										<div className='text-sm text-muted-foreground mb-2'>
											<span className='text-foreground font-semibold'>
												{leadsWithPhone.length}
											</span>{' '}
											leads will receive this message via WhatsApp
										</div>
										<div className='max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar'>
											{leadsWithPhone.map((lead, i) => (
												<div
													key={i}
													className='bg-muted/30 border border-border/50 p-2.5 rounded-lg flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'
												>
													<span className='text-sm font-medium truncate pr-4'>
														{lead.title || 'Unnamed Lead'}
													</span>
													<span className='text-xs text-muted-foreground font-mono bg-background px-1.5 py-0.5 rounded border border-border/30 whitespace-nowrap'>
														{lead.phone}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>

							<div
								className='group flex items-start gap-3
									rounded-xl border border-border/60
									bg-card/60 px-4 py-3
									backdrop-blur-sm
									transition-all duration-200
									hover:bg-card hover:border-border
									hover:shadow-sm
									cursor-default'
							>
								<Info
									className='mt-0.5 h-4 w-4
										shrink-0 text-muted-foreground
										transition-colors duration-200
										group-hover:text-foreground'
								/>

								<p
									className='text-sm leading-6
										tracking-tight text-muted-foreground
										font-normal'
								>
									To reduce the risk of WhatsApp blocking bulk messages, the
									system automatically applies a
									<span
										className='
											mx-1 font-semibold
											text-foreground
										'
									>
										3-second delay
									</span>
									between each message.
								</p>
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
									disabled={leadsWithPhone.length === 0 || isSending}
									className='flex-1 rounded-xl gap-2 bg-green-500 hover:bg-green-600'
								>
									{isSending ? (
										<>
											<Loader2
												size={14}
												className='animate-spin'
											/>
											Sending...
										</>
									) : (
										<>
											{selectedLeads.length === 1 ? 'Send' : 'Send to All'}
											<ExternalLink size={14} />
										</>
									)}
								</Button>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Warning Dialog */}
			{showWarningDialog && (
				<div className='fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
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
