import { useRef } from 'react';
import { Bold, Italic, Strikethrough, Code } from 'lucide-react';

export const KEYWORD_GROUPS = {
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
};

type Props = {
	value: string;
	onChange: (value: string) => void;
};

export default function MessageEditor({ value, onChange }: Props) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const insertAtCursor = (keyword: string) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const before = value.slice(0, start);
		const after = value.slice(end);
		const inserted = `{{${keyword}}}`;

		const newContent = before + inserted + after;
		onChange(newContent);

		requestAnimationFrame(() => {
			textarea.focus();
			const newPos = start + inserted.length;
			textarea.setSelectionRange(newPos, newPos);
		});
	};

	const insertFormat = (format: string) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const before = value.slice(0, start);
		const selected = value.slice(start, end);
		const after = value.slice(end);

		const inserted = `${format}${selected}${format}`;
		const newContent = before + inserted + after;
		onChange(newContent);

		requestAnimationFrame(() => {
			textarea.focus();
			const newPos = selected ? start + inserted.length : start + format.length;
			textarea.setSelectionRange(newPos, newPos);
		});
	};

	return (
		<div className='bg-muted/30 p-5 border border-border/50 rounded-2xl space-y-4'>
			<div className='flex items-center gap-1 pb-2 border-b border-border/40'>
				<button
					onClick={() => insertFormat('*')}
					className='p-1.5 transition-colors hover:bg-muted rounded-md text-muted-foreground hover:text-foreground active:scale-95'
					title='Bold (*text*)'
				>
					<Bold size={15} />
				</button>
				<button
					onClick={() => insertFormat('_')}
					className='p-1.5 transition-colors hover:bg-muted rounded-md text-muted-foreground hover:text-foreground active:scale-95'
					title='Italic (_text_)'
				>
					<Italic size={15} />
				</button>
				<button
					onClick={() => insertFormat('~')}
					className='p-1.5 transition-colors hover:bg-muted rounded-md text-muted-foreground hover:text-foreground active:scale-95'
					title='Strikethrough (~text~)'
				>
					<Strikethrough size={15} />
				</button>
				<div className='w-px h-4 bg-border/50 mx-1' />
				<button
					onClick={() => insertFormat('```')}
					className='p-1.5 transition-colors hover:bg-muted rounded-md text-muted-foreground hover:text-foreground active:scale-95'
					title='Monospace (```text```)'
				>
					<Code size={15} />
				</button>
			</div>

			<textarea
				ref={textareaRef}
				className='w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 min-h-[180px] font-mono leading-relaxed resize-y placeholder:text-muted-foreground/50'
				placeholder='Type your message...'
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
				}}
			/>

			<div>
				<p className='text-[10px] font-bold text-muted-foreground mb-2 px-1 uppercase'>
					Insert Dynamic Variable
				</p>
				<div className='space-y-3'>
					{Object.entries(KEYWORD_GROUPS).map(([groupKey, group]) => (
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
										className='text-[11px] font-medium px-2.5 py-1 rounded-md border border-border bg-background hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all active:scale-95'
									>
										{kw.key}
									</button>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
