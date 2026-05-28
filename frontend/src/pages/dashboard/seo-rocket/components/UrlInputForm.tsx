'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, FolderTree, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import type { SeoAnalysisMode, SeoAnalysisHistoryItem } from '@/types/seo.types';
import { seoService } from '@/service/seo.service';

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
	const [historyItems, setHistoryItems] = useState<SeoAnalysisHistoryItem[]>([]);
	const [suggestions, setSuggestions] = useState<SeoAnalysisHistoryItem[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [showSuggestions, setShowSuggestions] = useState(false);

	const dropdownRef = useRef<HTMLDivElement>(null);

	// Load previous analysis history on component mount
	useEffect(() => {
		const loadHistory = async () => {
			try {
				const response = await seoService.getAnalysisHistory({ page: 1, limit: 100 });
				if (response.success && response.data?.analyses) {
					setHistoryItems(response.data.analyses);
				}
			} catch (error) {
				console.error('Failed to load SEO analysis history:', error);
			}
		};
		loadHistory();
	}, []);

	// Click outside listener to dismiss suggestions
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setUrl(value);

		if (value.trim()) {
			const query = value.toLowerCase();
			const seenUrls = new Set<string>();
			const filtered = historyItems.filter((item) => {
				const targetUrl = item.requestedUrl || '';
				if (!targetUrl) return false;

				// Substring match: matches when user types any part (e.g. back, ders, http)
				const isMatch = targetUrl.toLowerCase().includes(query);
				if (isMatch && !seenUrls.has(targetUrl)) {
					seenUrls.add(targetUrl);
					return true;
				}
				return false;
			});
			setSuggestions(filtered);
			setShowSuggestions(true);
		} else {
			setSuggestions([]);
			setShowSuggestions(false);
		}
		setSelectedIndex(-1);
	};

	const selectSuggestion = (selectedUrl: string) => {
		setUrl(selectedUrl);
		setShowSuggestions(false);
		setSelectedIndex(-1);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!showSuggestions || suggestions.length === 0) {
			return;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setSelectedIndex((prevIndex) => {
				const nextIndex = prevIndex + 1;
				return nextIndex >= suggestions.length ? 0 : nextIndex;
			});
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex((prevIndex) => {
				const nextIndex = prevIndex - 1;
				return nextIndex < 0 ? suggestions.length - 1 : nextIndex;
			});
		} else if (e.key === 'Enter') {
			if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
				e.preventDefault();
				selectSuggestion(suggestions[selectedIndex].requestedUrl);
			}
		} else if (e.key === 'Escape') {
			e.preventDefault();
			setShowSuggestions(false);
			setSelectedIndex(-1);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (url.trim()) {
			let formattedUrl = url.trim();

			// Add https:// if protocol is missing
			if (!/^https?:\/\//i.test(formattedUrl)) {
				formattedUrl = `https://${formattedUrl}`;
			}

			onDiscover(formattedUrl, mode);
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
					<div className='relative group' ref={dropdownRef}>
						<Input
							type='text'
							placeholder='https://example.com'
							value={url}
							onChange={handleInputChange}
							onKeyDown={handleKeyDown}
							onFocus={() => {
								if (url.trim() && suggestions.length > 0) {
									setShowSuggestions(true);
								}
							}}
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

						{/* Suggestions Dropdown */}
						{showSuggestions && suggestions.length > 0 && (
							<div className='absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-card shadow-lg max-h-60 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-200'>
								<div className='px-3.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1.5 mb-1.5'>
									Previous Analyses
								</div>
								{suggestions.map((suggestion, index) => {
									const isSelected = index === selectedIndex;
									return (
										<button
											key={suggestion._id}
											type='button'
											onClick={() => selectSuggestion(suggestion.requestedUrl)}
											onMouseEnter={() => setSelectedIndex(index)}
											className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-all duration-150 active:scale-99
												${
													isSelected
														? 'bg-primary/10 text-primary font-semibold tracking-tight'
														: 'text-foreground hover:bg-muted/50'
												}
											`}
										>
											<Clock className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
											<span className='truncate'>{suggestion.requestedUrl}</span>
										</button>
									);
								})}
							</div>
						)}
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
