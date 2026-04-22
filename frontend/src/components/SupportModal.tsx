import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, MessageSquare, Loader2, Star } from 'lucide-react';
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

	// Sync state when modal opens or initialType changes
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

		// Capture some basic metadata for error reports
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

		// Reset and close
		setSubject('');
		setMessage('');
		onClose();
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<div className='fixed inset-0 z-10000 flex items-center justify-center p-4'>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
					className='absolute inset-0 bg-black/60 backdrop-blur-sm'
				/>

				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 20 }}
					className='relative w-full max-width-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800'
				>
					{/* Header */}
					<div className='p-6 border-bottom border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50'>
						<div>
							<h2 className='text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2'>
								{type === 'feedback' ? (
									<MessageSquare className='w-5 h-5 text-blue-500' />
								) : (
									<AlertCircle className='w-5 h-5 text-rose-500' />
								)}
								{type === 'feedback' ? 'Share Feedback' : 'Report an Issue'}
							</h2>
							<p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>
								{type === 'feedback'
									? 'We love to hear your thoughts on how to improve.'
									: 'Found a bug? Let us know and we will fix it ASAP.'}
							</p>
						</div>
						<button
							onClick={onClose}
							className='p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors'
						>
							<X className='w-5 h-5 text-slate-500' />
						</button>
					</div>

					<form
						onSubmit={handleSubmit}
						className='p-6 space-y-5'
					>
						{/* Type Selector */}
						<div className='flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2'>
							<button
								type='button'
								onClick={() => setType('feedback')}
								className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
									type === 'feedback'
										? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10'
										: 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
								}`}
							>
								<MessageSquare className='w-4 h-4' />
								Feedback
							</button>
							<button
								type='button'
								onClick={() => setType('error')}
								className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
									type === 'error'
										? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/10'
										: 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
								}`}
							>
								<AlertCircle className='w-4 h-4' />
								Bug Report
							</button>
						</div>

						{/* Feedback Rating */}
						{type === 'feedback' && (
							<div className='space-y-3 p-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100/50 dark:border-blue-500/10'>
								<label className='text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2'>
									<Star className='w-4 h-4 text-amber-500 fill-amber-500' />
									How would you rate your experience?
								</label>
								<div className='flex items-center gap-2'>
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											type='button'
											onMouseEnter={() => setHoveredRating(star)}
											onMouseLeave={() => setHoveredRating(0)}
											onClick={() => setRating(star)}
											className='transition-transform active:scale-90'
										>
											<Star
												className={`w-8 h-8 transition-colors ${
													star <= (hoveredRating || rating)
														? 'text-amber-500 fill-amber-500'
														: 'text-slate-300 dark:text-slate-600'
												}`}
											/>
										</button>
									))}
									{rating > 0 && (
										<span className='ml-2 text-sm font-semibold text-amber-600 dark:text-amber-400'>
											{rating === 1 && 'Poor'}
											{rating === 2 && 'Fair'}
											{rating === 3 && 'Good'}
											{rating === 4 && 'Very Good'}
											{rating === 5 && 'Excellent!'}
										</span>
									)}
								</div>
							</div>
						)}

						{/* Subject */}
						<div className='space-y-2'>
							<label className='text-sm font-semibold text-slate-700 dark:text-slate-300'>
								Subject
							</label>
							<input
								type='text'
								required
								value={subject}
								onChange={(e) => setSubject(e.target.value)}
								placeholder={
									type === 'feedback'
										? 'What is on your mind?'
										: 'Brief description of the problem'
								}
								className='w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all'
							/>
						</div>

						{/* Message */}
						<div className='space-y-2'>
							<label className='text-sm font-semibold text-slate-700 dark:text-slate-300'>
								Details
							</label>
							<textarea
								required
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								rows={4}
								placeholder={
									type === 'feedback'
										? 'Tell us what you like or what we can do better...'
										: 'Please describe the steps to reproduce the issue...'
								}
								className='w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none'
							/>
						</div>

						{/* Footer Actions */}
						<div className='pt-2 flex items-center gap-3'>
							<button
								type='button'
								onClick={onClose}
								className='flex-1 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all'
							>
								Cancel
							</button>
							<button
								type='submit'
								disabled={submitMutation.isPending}
								className={`flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all ${
									type === 'feedback'
										? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
										: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
								} disabled:opacity-70 disabled:cursor-not-allowed shadow-lg`}
							>
								{submitMutation.isPending ? (
									<Loader2 className='w-5 h-5 animate-spin' />
								) : (
									<>
										<Send className='w-5 h-5' />
										Submit {type === 'feedback' ? 'Feedback' : 'Report'}
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
