import { useState, useMemo, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Info } from 'lucide-react';
import {
	useCreateMessageTemplate,
	useDeleteMessageTemplate,
	useMessageTemplates,
	useUpdateMessageTemplate,
} from '@/query/messageTemplate.query';
import { useAuth } from '@/query/auth.query';

const KEYWORD_GROUPS = {
	LEAD: {
		label: 'Lead Info',
		keywords: [
			{ key: 'title', desc: 'Business name' },
			{ key: 'phone', desc: 'Phone number' },
			{ key: 'website', desc: 'Website URL' },
			{ key: 'address', desc: 'Full address' },
			{ key: 'googleMapUrl', desc: 'Google Maps link' },
			{ key: 'rating', desc: 'Star rating' },
			{ key: 'ratingCount', desc: 'Number of reviews' },
			{ key: 'position', desc: 'Listing position' },
		],
	},
	USER: {
		label: 'Your Profile',
		keywords: [
			{ key: 'userName', desc: 'Your name' },
			{ key: 'userEmail', desc: 'Your email' },
		],
	},
	DATE: {
		label: 'Date & Time',
		keywords: [
			{ key: 'date', desc: 'Current date' },
			{ key: 'time', desc: 'Current time' },
			{ key: 'day', desc: 'Day of week' },
			{ key: 'month', desc: 'Current month' },
			{ key: 'year', desc: 'Current year' },
		],
	},
	// UTILITY: {
	// 	label: 'Utility',
	// 	keywords: [
	// 		{ key: 'index', desc: 'Lead index number' },
	// 		{ key: 'totalLeads', desc: 'Total leads count' },
	// 		{ key: 'unsubscribeUrl', desc: 'Unsubscribe link' },
	// 	],
	// },
};

// const ALL_KEYWORDS = Object.values(KEYWORD_GROUPS).flatMap((g) =>
// 	g.keywords.map((k) => k.key)
// );

const templateStruct: IMessageTemplate = {
	title: '',
	description: '',
	content: '',
};

export default function TemplateManager() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [currentTemplate, setCurrentTemplate] =
		useState<IMessageTemplate>(templateStruct);
	const [cursorPos, setCursorPos] = useState(0);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const { data: templatesResponse, isFetching: loadingTemplate } =
		useMessageTemplates();
	const { data: authUser } = useAuth();
	const { mutate: createMessageTemplate } = useCreateMessageTemplate();
	const { mutate: updateMessageTemplate } = useUpdateMessageTemplate();
	const { mutate: deleteMessageTemplate } = useDeleteMessageTemplate();

	const insertAtCursor = (keyword: string) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const content = currentTemplate.content || '';
		const before = content.slice(0, start);
		const after = content.slice(end);
		const inserted = `{{${keyword}}}`;

		const newContent = before + inserted + after;
		setCurrentTemplate((p) => ({ ...p, content: newContent }));

		requestAnimationFrame(() => {
			textarea.focus();
			const newPos = start + inserted.length;
			textarea.setSelectionRange(newPos, newPos);
		});
	};

	const templates = templatesResponse?.data;

	const formatContent = (text: string) => {
		if (!text)
			return (
				<span className='text-muted-foreground italic text-sm'>
					Preview will appear here...
				</span>
			);
		const lines = text.split('\n');
		return lines.map((line, lineIndex) => {
			const parts = line.split(/(\{\{[\w]+\}\})/g);
			return (
				<span key={lineIndex}>
					{parts.map((part, partIndex) => {
						if (part.startsWith('{{') && part.endsWith('}}')) {
							return (
								<span
									key={partIndex}
									className='inline-block px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[0.8rem] border border-primary/20 mx-0.5'
								>
									{part}
								</span>
							);
						}
						return <span key={partIndex}>{part}</span>;
					})}
					{lineIndex < lines.length - 1 && <br />}
				</span>
			);
		});
	};

	const resolveTemplate = useMemo(() => {
		const now = new Date();
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

		return (template: string) => {
			if (!template) return '';

			const availableReplacements: Record<string, string> = {
				userName: authUser?.userName || '',
				userEmail: authUser?.email || '',
				date: DATE_FORMATTER.format(now),
				time: TIME_FORMATTER.format(now),
				day: now.toLocaleDateString('en-US', { weekday: 'long' }),
				month: now.toLocaleDateString('en-US', { month: 'long' }),
				year: now.getFullYear().toString(),
			};

			return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
				if (availableReplacements[key] !== undefined) {
					return availableReplacements[key];
				}
				return match;
			});
		};
	}, [authUser]);

	const renderPreview = (text: string) => {
		if (!text)
			return (
				<span className='text-muted-foreground italic text-sm'>
					Preview will appear here...
				</span>
			);
		const resolved = resolveTemplate(text);
		const lines = resolved.split('\n');
		return lines.map((line, lineIndex) => (
			<span key={lineIndex}>
				{line}
				{lineIndex < lines.length - 1 && <br />}
			</span>
		));
	};

	const handleSave = () => {
		if (!currentTemplate.title || !currentTemplate.content) return;
		if (currentTemplate._id) {
			updateMessageTemplate({ id: currentTemplate._id, data: currentTemplate });
		} else {
			createMessageTemplate(currentTemplate);
		}
		closeDialog();
	};

	const closeDialog = () => {
		setCurrentTemplate({ title: '', description: '', content: '' });
		setIsDialogOpen(false);
	};

	if (loadingTemplate) return <p>loading</p>;

	return (
		<div className='min-h-screen bg-background text-foreground font-sans p-8 flex flex-col items-center'>
			<div className='w-full max-w-5xl'>
				{/* Header */}
				<div className='flex justify-between items-center mb-10 border-b border-border pb-6'>
					<div>
						<h1 className='text-2xl font-semibold tracking-tight'>
							Message Templates
						</h1>
						<p className='text-sm text-muted-foreground mt-1'>
							Create and manage dynamic snippets for your business.
						</p>
					</div>
					<button
						onClick={() => setIsDialogOpen(true)}
						className='bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition-all flex items-center gap-2'
					>
						<Plus size={18} /> Create Template
					</button>
				</div>

				{/* Template Grid */}
				{templates?.length === 0 ? (
					<div className='w-full'>
						<div className='w-full max-w-5xl flex flex-col items-center justify-center'>
							<div className='text-center space-y-4'>
								<div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 border border-border/50'>
									<Plus
										size={32}
										className='text-muted-foreground'
									/>
								</div>
								<h2 className='text-xl font-semibold tracking-tight'>
									No Templates Yet
								</h2>
								<p className='text-sm text-muted-foreground max-w-sm'>
									Create your first message template to get started with dynamic
									snippets for your business.
								</p>
							</div>
						</div>
					</div>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{templates?.map((t) => (
							<div
								key={t._id}
								className='group flex flex-col bg-card border border-border rounded-3xl p-5 hover:border-primary/40 transition-colors'
							>
								<div className='flex justify-between items-start mb-3'>
									<h3 className='font-bold text-sm tracking-tight truncate pr-2'>
										{t.title}
									</h3>
									<div className='flex gap-1'>
										<button
											onClick={() => {
												setCurrentTemplate(t);
												setIsDialogOpen(true);
											}}
											className='p-1.5 hover:bg-muted rounded-lg text-muted-foreground'
										>
											<Pencil size={14} />
										</button>
										<button
											onClick={() => deleteMessageTemplate(t._id!)}
											className='p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg text-muted-foreground'
										>
											<Trash2 size={14} />
										</button>
									</div>
								</div>

								<div className='flex-1 bg-muted/30 rounded-xl p-4 mb-4 border border-border/50 overflow-hidden'>
									<p className='text-sm leading-relaxed whitespace-pre-wrap'>
										{formatContent(t.content)}
									</p>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Create/Edit Dialog */}
				{isDialogOpen && (
					<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
						<div className='bg-card w-full max-w-xl rounded-[28px] shadow-2xl border border-border overflow-hidden'>
							<div className='px-8 pt-8 pb-4 flex justify-between items-center'>
								<h2 className='text-xl font-semibold tracking-tight'>
									{currentTemplate._id ? 'Edit Template' : 'New Template'}
								</h2>
								<button
									onClick={closeDialog}
									className='p-2 hover:bg-muted rounded-full transition-colors'
								>
									<X size={20} />
								</button>
							</div>

							<div className='p-8 space-y-5'>
								<div className='space-y-1.5'>
									<label className='text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1'>
										Label
									</label>
									<input
										className='w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20'
										placeholder='e.g. Sales Follow-up'
										value={currentTemplate.title}
										onChange={(e) =>
											setCurrentTemplate({
												...currentTemplate,
												title: e.target.value,
											})
										}
									/>
								</div>

								<div className='space-y-1.5'>
									<label className='text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1'>
										Message Body
									</label>
									<textarea
										ref={textareaRef}
										className='w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 min-h-30 font-mono leading-relaxed max-h-56'
										placeholder='Type your message...'
										value={currentTemplate.content}
										onChange={(e) => {
											setCursorPos(e.target.selectionStart);
											setCurrentTemplate((p) => ({
												...p,
												content: e.target.value,
											}));
										}}
										onSelect={(e) =>
											setCursorPos(
												(e.target as HTMLTextAreaElement).selectionStart,
											)
										}
										onClick={(e) =>
											setCursorPos(
												(e.target as HTMLTextAreaElement).selectionStart,
											)
										}
									/>

									<div className='pt-2'>
										<p className='text-[10px] font-bold text-muted-foreground mb-2 px-1 uppercase'>
											Insert Dynamic Variable
										</p>
										<div className='space-y-3'>
											{Object.entries(KEYWORD_GROUPS).map(
												([groupKey, group]) => (
													<div key={groupKey}>
														<p className='text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5'>
															{group.label}
														</p>
														<div className='flex flex-wrap gap-1.5'>
															{group.keywords.map((kw) => (
																<button
																	key={kw.key}
																	onClick={() => insertAtCursor(kw.key)}
																	title={kw.desc}
																	className='text-[11px] font-medium px-2.5 py-1 rounded-md border border-border bg-muted/50 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all active:scale-95'
																>
																	{kw.key}
																</button>
															))}
														</div>
													</div>
												),
											)}
										</div>
									</div>
								</div>

								<div className='bg-muted/30 border border-border/50 rounded-2xl p-4 mt-2 overflow-auto max-h-56'>
									<p className='text-[10px] font-bold text-muted-foreground mb-2 uppercase flex items-center gap-1'>
										<Info size={12} /> Preview
									</p>
									<div className='text-sm leading-relaxed whitespace-pre-wrap'>
										{renderPreview(currentTemplate.content || '')}
									</div>
								</div>

								<div className='flex justify-end gap-3 pt-4 border-t border-border mt-6'>
									<button
										onClick={closeDialog}
										className='px-5 py-2 text-sm font-medium hover:bg-muted rounded-xl transition-colors'
									>
										Cancel
									</button>
									<button
										onClick={handleSave}
										className='bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-all'
									>
										Save Template
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
