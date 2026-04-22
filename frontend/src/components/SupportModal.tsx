'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	X,
	Send,
	AlertCircle,
	MessageSquare,
	Loader2,
	Star,
} from 'lucide-react';
import { useSubmitSupport } from '../query/support.query';

interface SupportModalProps {
	isOpen: boolean;
	onClose: () => void;
	initialType?: 'feedback' | 'error';
}

export default function SupportModal({
	isOpen,
	onClose,
	initialType = 'feedback',
}: SupportModalProps) {
	const [type, setType] = useState<'feedback' | 'error'>(initialType);
	const [subject, setSubject] = useState('');
	const [message, setMessage] = useState('');
	const [rating, setRating] = useState<number>(0);
	const [hoveredRating, setHoveredRating] = useState<number>(0);

	useEffect(() => {
		if (isOpen) {
			setType(initialType);
			setSubject('');
			setMessage('');
			setRating(0);
		}
	}, [isOpen, initialType]);

	const submitMutation = useSubmitSupport();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const metadata =
			type === 'error'
				? {
						url: window.location.href,
						userAgent: navigator.userAgent,
						viewport: `${window.innerWidth}x${window.innerHeight}`,
						timestamp: new Date().toISOString(),
					}
				: undefined;

		await submitMutation.mutateAsync({
			type,
			subject,
			message,
			rating: type === 'feedback' ? rating : undefined,
			metadata,
		});

		setSubject('');
		setMessage('');
		onClose();
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
					className='absolute inset-0 bg-black/40 backdrop-blur-[2px]'
				/>

				<motion.div
					initial={{ opacity: 0, scale: 0.98, y: 8 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.98, y: 8 }}
					className='relative w-full max-w-[440px] overflow-hidden rounded-xl border border-border bg-card shadow-xl transition-all duration-200'
				>
					{/* Header */}
					<div className='flex items-center justify-between border-b border-border bg-background/50 px-5 py-4'>
						<div className='flex items-center gap-2.5'>
							<div
								className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
									type === 'feedback'
										? 'border-blue-500/20 bg-blue-500/10 text-blue-500'
										: 'border-destructive/20 bg-destructive/10 text-destructive'
								}`}
							>
								{type === 'feedback' ? (
									<MessageSquare size={16} />
								) : (
									<AlertCircle size={16} />
								)}
							</div>
							<div>
								<h2 className='text-[15px] font-semibold tracking-tight text-foreground'>
									{type === 'feedback' ? 'Share Feedback' : 'Report an Issue'}
								</h2>
								<p className='text-[12px] text-muted-foreground'>
									{type === 'feedback'
										? 'How can we improve your experience?'
										: 'Help us improve by describing the bug.'}
								</p>
							</div>
						</div>
						<button
							onClick={onClose}
							className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95'
						>
							<X size={16} />
						</button>
					</div>

					<form
						onSubmit={handleSubmit}
						className='p-5 space-y-4'
					>
						{/* Toggle Switch */}
						<div className='flex rounded-lg border border-border bg-background p-1'>
							<button
								type='button'
								onClick={() => setType('feedback')}
								className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium transition-all ${
									type === 'feedback'
										? 'bg-card text-foreground shadow-sm border border-border'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								Feedback
							</button>
							<button
								type='button'
								onClick={() => setType('error')}
								className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium transition-all ${
									type === 'error'
										? 'bg-card text-foreground shadow-sm border border-border'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								Bug Report
							</button>
						</div>

						{/* Rating Section */}
						{type === 'feedback' && (
							<div className='rounded-xl border border-border bg-background/30 p-3 flex flex-col items-center gap-2'>
								<span className='text-[11px] font-medium uppercase tracking-wider text-muted-foreground'>
									Rate your experience
								</span>
								<div className='flex items-center gap-1.5'>
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											type='button'
											onMouseEnter={() => setHoveredRating(star)}
											onMouseLeave={() => setHoveredRating(0)}
											onClick={() => setRating(star)}
											className='group relative transition-transform active:scale-90'
										>
											<Star
												size={22}
												className={`transition-all duration-200 ${
													star <= (hoveredRating || rating)
														? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]'
														: 'text-muted-foreground/30'
												}`}
											/>
										</button>
									))}
								</div>
								{rating > 0 && (
									<p className='text-[11px] font-medium text-amber-500 animate-in fade-in slide-in-from-top-1'>
										{
											['Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][
												rating - 1
											]
										}
									</p>
								)}
							</div>
						)}

						{/* Inputs */}
						<div className='space-y-3'>
							<div className='space-y-1.5'>
								<label className='text-[13px] font-medium text-foreground'>
									Subject
								</label>
								<input
									type='text'
									required
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									placeholder={
										type === 'feedback'
											? 'Short summary...'
											: 'What went wrong?'
									}
									className='w-full rounded-xl border border-border bg-background px-3 py-2 text-[13px] transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10'
								/>
							</div>

							<div className='space-y-1.5'>
								<label className='text-[13px] font-medium text-foreground'>
									Details
								</label>
								<textarea
									required
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									rows={3}
									placeholder={
										type === 'feedback'
											? 'Tell us more...'
											: 'Describe the steps to reproduce...'
									}
									className='w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-[13px] transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10'
								/>
							</div>
						</div>

						{/* Footer */}
						<div className='flex items-center gap-2 pt-2'>
							<button
								type='button'
								onClick={onClose}
								className='flex-1 rounded-xl border border-border py-2 text-[13px] font-medium transition-all hover:bg-secondary active:scale-[0.98]'
							>
								Cancel
							</button>
							<button
								type='submit'
								disabled={submitMutation.isPending}
								className={`flex-[2] flex items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-medium text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50 ${
									type === 'feedback'
										? 'bg-primary hover:opacity-90'
										: 'bg-destructive hover:opacity-90'
								}`}
							>
								{submitMutation.isPending ? (
									<Loader2
										size={16}
										className='animate-spin'
									/>
								) : (
									<>
										<Send size={14} />
										<span>
											Submit {type === 'feedback' ? 'Feedback' : 'Report'}
										</span>
									</>
								)}
							</button>
						</div>
					</form>
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
