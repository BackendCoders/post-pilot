'use client';

import { useState } from 'react';
import { Search, FolderTree, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import type { SeoAnalysisMode } from '@/types/seo.types';

interface UrlInputFormProps {
	onDiscover: (url: string, mode: SeoAnalysisMode) => void;
	isLoading: boolean;
}

export default function UrlInputForm({
	onDiscover,
	isLoading,
}: UrlInputFormProps) {
	const [url, setUrl] = useState('');
	const [mode, setMode] = useState<SeoAnalysisMode>('site');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (url.trim()) {
			onDiscover(url.trim(), mode);
		}
	};

	const modeOptions: {
		value: SeoAnalysisMode;
		label: string;
		icon: React.ReactNode;
	}[] = [
		{
			value: 'page',
			label: 'Single Page',
			icon: <Search className='h-3.5 w-3.5' />,
		},
		{
			value: 'site',
			label: 'Full Site',
			icon: <FolderTree className='h-3.5 w-3.5' />,
		},
	];

	return (
		<Card className='border-none shadow-none bg-transparent'>
			<CardHeader className='px-4 pt-4 pb-2'>
				<CardTitle className='text-lg font-bold tracking-tight'>
					Discover Content
				</CardTitle>
				<CardDescription className='text-xs'>
					Enter a domain or URL to begin the SEO audit process
				</CardDescription>
			</CardHeader>
			<CardContent className='px-4 pb-4'>
				<form
					onSubmit={handleSubmit}
					className='space-y-4'
				>
					<div className='relative group'>
						<Input
							type='url'
							placeholder='https://example.com'
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							data-walkthrough='seo-url-input'
							className='h-11 pl-3 pr-28 rounded-xl border-border bg-card shadow-sm transition-all focus-visible:ring-primary/20'
						/>
						<div className='absolute right-1.5 top-1.5'>
							<Button
								type='submit'
								size='sm'
								disabled={!url.trim() || isLoading}
								data-walkthrough='seo-analyze-btn'
								className='h-8 rounded-lg px-4 font-semibold transition-all active:scale-95'
							>
								{isLoading ? (
									<Loader2 className='h-3.5 w-3.5 animate-spin' />
								) : (
									'Discover'
								)}
							</Button>
						</div>
					</div>

					<div className='flex flex-wrap gap-2'>
						{modeOptions.map((option) => {
							const isActive = mode === option.value;
							return (
								<button
									key={option.value}
									type='button'
									onClick={() => setMode(option.value)}
									className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border
                    ${
											isActive
												? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10'
												: 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50'
										}
                  `}
								>
									<span
										className={
											isActive ? 'text-primary-foreground' : 'text-primary'
										}
									>
										{option.icon}
									</span>
									<span>{option.label}</span>
								</button>
							);
						})}
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
