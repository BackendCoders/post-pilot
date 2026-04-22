'use client';

import { useState, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
	Instagram,
	Facebook,
	Music2,
	ImagePlus,
	Layers,
	X,
	Plus,
	Hash,
	CirclePlay,
	CircleFadingPlus,
} from 'lucide-react';

// ─── Types & Constants ────────────────────────────────────────────────────────
type PlatformName = 'Instagram' | 'Facebook' | 'TikTok';
type ContentType = 'Post' | 'Reel' | 'Story' | 'Carousel';
type DeviceType = 'iPhone' | 'iPad' | 'Samsung';

const PLATFORMS: Record<PlatformName, { icon: ReactNode; color: string }> = {
	Instagram: {
		icon: <Instagram className='w-4 h-4' />,
		color: 'hover:bg-accent/50',
	},
	Facebook: {
		icon: <Facebook className='w-4 h-4' />,
		color: 'hover:bg-accent/50',
	},
	TikTok: { icon: <Music2 className='w-4 h-4' />, color: 'hover:bg-accent/50' },
};

const DEVICES: Record<
	DeviceType,
	{ width: string; height: string; rounded: string }
> = {
	iPhone: {
		width: 'w-[300px]',
		height: 'h-[620px]',
		rounded: 'rounded-[3rem]',
	},
	Samsung: {
		width: 'w-[320px]',
		height: 'h-[650px]',
		rounded: 'rounded-[1.5rem]',
	},
	iPad: {
		width: 'w-[480px]',
		height: 'h-[620px]',
		rounded: 'rounded-[2.5rem]',
	},
};

// ─── Components ──────────────────────────────────────────────────────────────

const GoogleSection = ({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) => (
	<section className='bg-card rounded-2xl p-6 border border-border shadow-sm'>
		<h3 className='text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4'>
			{title}
		</h3>
		{children}
	</section>
);

const DevicePreview = ({
	caption,
	media,
	isVertical,
	hashtags,
}: {
	contentType: ContentType;
	caption: string;
	media: File[];
	isVertical: boolean;
	hashtags: string[];
}) => {
	const [device, setDevice] = useState<DeviceType>('iPhone');
	const [activeSlide, setActiveSlide] = useState(0);
	const scrollRef = useRef<HTMLDivElement>(null);

	const handleScroll = () => {
		if (scrollRef.current) {
			const index = Math.round(
				scrollRef.current.scrollLeft / scrollRef.current.offsetWidth,
			);
			setActiveSlide(index);
		}
	};

	return (
		<div className='flex flex-col items-center justify-center h-full w-full bg-muted/30 p-8'>
			{/* Device Toggle */}
			<div className='flex bg-secondary p-1 rounded-2xl mb-12 border border-border'>
				{(Object.keys(DEVICES) as DeviceType[]).map((d) => (
					<button
						key={d}
						onClick={() => setDevice(d)}
						className={cn(
							'px-6 py-2 rounded-xl text-xs font-medium transition-all',
							device === d
								? 'bg-background shadow-sm text-primary'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						{d}
					</button>
				))}
			</div>

			{/* The Device Frame */}
			<div
				className={cn(
					'relative bg-zinc-950 border-8 border-zinc-800 shadow-2xl transition-all duration-500 flex flex-col overflow-hidden',
					DEVICES[device].width,
					DEVICES[device].height,
					DEVICES[device].rounded,
				)}
			>
				<div className='flex-1 flex flex-col bg-background overflow-hidden relative'>
					{/* Header */}
					<div className='flex items-center gap-3 p-4 pt-8'>
						<div className='w-7 h-7 rounded-full bg-muted' />
						<div className='h-2 w-24 bg-muted rounded-full' />
					</div>

					{/* Media Container */}
					<div
						className={cn(
							'relative w-full bg-muted/50 flex items-center justify-center group overflow-hidden',
							isVertical ? 'flex-1' : 'aspect-square',
						)}
					>
						{media.length > 0 ? (
							<div
								ref={scrollRef}
								onScroll={handleScroll}
								className='flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth'
							>
								{media.map((file, i) => (
									<div
										key={i}
										className='min-w-full h-full snap-center flex items-center justify-center'
									>
										{file.type.startsWith('video') ? (
											<video
												src={URL.createObjectURL(file)}
												className='max-w-full max-h-full w-auto h-auto object-contain'
												autoPlay
												muted
												loop
											/>
										) : (
											<img
												src={URL.createObjectURL(file)}
												className='max-w-full max-h-full w-auto h-auto object-contain'
												alt='preview'
											/>
										)}
									</div>
								))}
							</div>
						) : (
							<ImagePlus className='w-8 h-8 text-muted-foreground/40' />
						)}

						{media.length > 1 && (
							<div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10'>
								{media.map((_, i) => (
									<div
										key={i}
										className={cn(
											'w-1.5 h-1.5 rounded-full transition-all',
											i === activeSlide ? 'bg-primary w-3' : 'bg-background/50',
										)}
									/>
								))}
							</div>
						)}
					</div>

					{/* Content */}
					<div className='p-4 space-y-2'>
						<div className='flex gap-3 mb-1'>
							<div className='w-4 h-4 rounded-full border border-border' />
							<div className='w-4 h-4 rounded-full border border-border' />
						</div>
						<p className='text-[11px] leading-relaxed text-foreground'>
							<span className='font-bold mr-2'>username</span>
							{caption}
							<span className='text-primary ml-1'>
								{hashtags.map((h) => `#${h} `)}
							</span>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default function ConsolePage() {
	const [platforms, setPlatforms] = useState<PlatformName[]>(['Instagram']);
	const [contentType, setContentType] = useState<ContentType>('Post');
	const [caption, setCaption] = useState('');
	const [tagInput, setTagInput] = useState('');
	const [hashtags, setHashtags] = useState<string[]>([]);
	const [media, setMedia] = useState<File[]>([]);
	const fileRef = useRef<HTMLInputElement>(null);

	const isVertical = contentType === 'Reel' || contentType === 'Story';
	const allowsMultiple = contentType === 'Post' || contentType === 'Carousel';

	const handleTagKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			const tag = tagInput.trim().replace(/^#/, '');
			if (tag && !hashtags.includes(tag)) {
				setHashtags([...hashtags, tag]);
			}
			setTagInput('');
		} else if (e.key === 'Backspace' && !tagInput && hashtags.length > 0) {
			setHashtags(hashtags.slice(0, -1));
		}
	};

	return (
		<div className='flex flex-1 w-full h-full overflow-hidden'>
			{/* Editor Area */}
			<div className='w-[40%] overflow-y-auto p-10 space-y-6 border-r border-border bg-background'>
					<h2 className='text-2xl font-normal mb-8 tracking-tight'>
						Create Post
					</h2>

					<GoogleSection title='Target Platforms'>
						<div className='flex gap-2'>
							{(Object.keys(PLATFORMS) as PlatformName[]).map((name) => (
								<button
									key={name}
									onClick={() =>
										setPlatforms((prev) =>
											prev.includes(name)
												? prev.filter((p) => p !== name)
												: [...prev, name],
										)
									}
									className={cn(
										'flex-1 py-3 rounded-xl border flex flex-col items-center gap-2 transition-all',
										platforms.includes(name)
											? 'border-primary bg-primary/5 text-primary'
											: 'border-border text-muted-foreground hover:bg-muted/50',
									)}
								>
									{PLATFORMS[name].icon}
									<span className='text-[10px] font-bold uppercase tracking-wider'>
										{name}
									</span>
								</button>
							))}
						</div>
					</GoogleSection>

					<GoogleSection title='Format'>
						<div className='grid grid-cols-2 gap-2'>
							{['Post', 'Reel', 'Story', 'Carousel'].map((type) => (
								<button
									key={type}
									onClick={() => setContentType(type as ContentType)}
									className={cn(
										'px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-3',
										contentType === type
											? 'border-primary bg-primary text-primary-foreground shadow-sm'
											: 'border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground',
									)}
								>
									{type === 'Post' && <ImagePlus className='w-4 h-4' />}
									{type === 'Carousel' && <Layers className='w-4 h-4' />}
									{type === 'Reel' && <CirclePlay className='w-4 h-4' />}
									{type === 'Story' && <CircleFadingPlus className='w-4 h-4' />}
									{type}
								</button>
							))}
						</div>
					</GoogleSection>

					<GoogleSection title={`Media Library (${media.length}/10)`}>
						<div className='grid grid-cols-4 gap-2'>
							{media.map((file, idx) => (
								<div
									key={idx}
									className='relative aspect-square rounded-lg overflow-hidden bg-muted border border-border group'
								>
									<img
										src={URL.createObjectURL(file)}
										className='w-full h-full object-cover'
										alt='thumb'
									/>
									<button
										onClick={() => setMedia(media.filter((_, i) => i !== idx))}
										className='absolute top-1 right-1 p-1 bg-background text-foreground rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity'
									>
										<X className='w-3 h-3' />
									</button>
								</div>
							))}
							<button
								onClick={() => fileRef.current?.click()}
								className='aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:bg-muted/50 transition-colors'
							>
								<Plus className='w-4 h-4 text-muted-foreground' />
							</button>
						</div>
						<input
							type='file'
							ref={fileRef}
							className='hidden'
							multiple={allowsMultiple}
							accept='image/*,video/*'
							onChange={(e) =>
								e.target.files &&
								setMedia([...media, ...Array.from(e.target.files)])
							}
						/>
					</GoogleSection>

					<GoogleSection title='Caption & Hashtags'>
						<textarea
							value={caption}
							onChange={(e) => setCaption(e.target.value)}
							className='w-full p-0 bg-transparent border-none outline-none text-base resize-none placeholder:text-muted-foreground/40 min-h-[100px]'
							placeholder='What is on your mind?'
						/>

						<div className='mt-4 pt-4 border-t border-border'>
							<div className='flex flex-wrap gap-2 mb-2'>
								{hashtags.map((tag, i) => (
									<span
										key={i}
										className='bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1'
									>
										#{tag}
										<X
											className='w-3 h-3 cursor-pointer'
											onClick={() =>
												setHashtags(hashtags.filter((_, idx) => idx !== i))
											}
										/>
									</span>
								))}
							</div>
							<div className='flex items-center gap-2 text-muted-foreground/50 focus-within:text-primary'>
								<Hash className='w-4 h-4 shrink-0' />
								<input
									type='text'
									value={tagInput}
									onChange={(e) => setTagInput(e.target.value)}
									onKeyDown={handleTagKeyDown}
									placeholder='Add tags (Press space)...'
									className='w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/30'
								/>
							</div>
						</div>
					</GoogleSection>
				</div>

				{/* Preview Area */}
				<div className='w-[60%]'>
					<DevicePreview
						contentType={contentType}
						caption={caption}
						media={media}
						isVertical={isVertical}
						hashtags={hashtags}
					/>
				</div>
		</div>
	);
}
