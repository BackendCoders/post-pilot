'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Settings2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SocialCardProps {
	Icon: React.ReactNode;
	social: string;
	description: string;
	onConnect: (apiLabel: string, token: string) => void;
	authToken?: string;
	apiLabel: string;
}

function SocialCard({
	Icon,
	social,
	description,
	authToken,
	onConnect,
	apiLabel,
}: SocialCardProps) {
	const navigate = useNavigate();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [inputToken, setInputToken] = useState(authToken || '');
	const isConnected = Boolean(authToken);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (inputToken.trim()) {
			onConnect(apiLabel, inputToken);
			setIsModalOpen(false);
			setInputToken('');
		}
	};

	return (
		<>
			<div className='group flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-muted/40 transition-colors duration-150 gap-4'>
				<div className='flex items-start gap-5'>
					{/* Icon Container */}
					<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-background border border-border shadow-2xs group-hover:border-border/100 transition-all'>
						{Icon}
					</div>

					<div className='flex flex-col space-y-1'>
						<div className='flex items-center gap-2'>
							<h3 className='text-[15px] font-medium leading-none'>{social}</h3>
							{isConnected && (
								<span className='text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider'>
									Linked
								</span>
							)}
						</div>
						<p className='text-sm text-muted-foreground leading-normal max-w-md'>
							{description}
						</p>
					</div>
				</div>

				<div className='flex items-center justify-end gap-2 sm:pl-0 pl-17'>
					{isConnected ? (
						<Button
							variant='secondary'
							className='rounded-full text-primary hover:bg-primary/10 px-4 h-9'
							onClick={() => setIsModalOpen(true)}
						>
							<Settings2
								size={16}
								className='mr-2'
							/>
							Update
						</Button>
					) : (
						<Button
							onClick={() => setIsModalOpen(true)}
							variant='outline'
							className='rounded-full border-border text-primary hover:bg-primary/5 hover:border-primary px-6 h-9 transition-all'
						>
							Connect
						</Button>
					)}
				</div>
			</div>

			{/* Auth Modal */}
			{isModalOpen && (
				<div className='fixed inset-0 z-100 flex items-center justify-center bg-foreground/20 backdrop-blur-[2px] p-4'>
					<div className='bg-popover text-popover-foreground w-full max-w-md rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200'>
						<div className='p-8'>
							<div className='flex justify-between items-center mb-6'>
								<div className='h-12 w-12 flex items-center justify-center bg-muted border border-border rounded-full'>
									{Icon}
								</div>
								<button
									onClick={() => setIsModalOpen(false)}
									className='text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors'
								>
									<X size={20} />
								</button>
							</div>

							<h2 className='text-2xl font-normal mb-2'>Connect {social}</h2>
							<p className='text-muted-foreground text-sm mb-8 leading-relaxed'>
								Enter your access token to link this service. You can revoke
								this permission anytime.
							</p>

							<form
								onSubmit={handleSubmit}
								className='space-y-6'
							>
								<div className='relative group'>
									<input
										autoFocus
										type='text'
										placeholder='Enter Token'
										value={inputToken}
										onChange={(e) => setInputToken(e.target.value)}
										className='peer w-full px-4 py-3 bg-transparent border border-input rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all'
									/>
									<label className='absolute left-3 -top-2.5 bg-popover px-1 text-xs text-muted-foreground transition-all peer-focus:text-primary peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-xs'>
										Access Token
									</label>
								</div>

								<div className='flex justify-end gap-3 pt-2'>
									<Button
										type='button'
										variant='ghost'
										onClick={() => setIsModalOpen(false)}
										className='text-muted-foreground rounded-full'
									>
										Cancel
									</Button>
									<Button
										type='submit'
										className='bg-primary text-primary-foreground hover:brightness-110 px-8 rounded-full font-medium shadow-none hover:shadow-md transition-all'
									>
										Link account
									</Button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export default SocialCard;
