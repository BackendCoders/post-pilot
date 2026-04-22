import { useEffect, useState } from 'react';
import { useAuth, useCompleteWalkthrough } from '@/query/auth.query';
import Walkthrough from '@/components/Walkthrough';
import {
	useScrapMapData,
	useBulkCreateLeads,
	useLeads,
	useScrapedLeadsState,
	useScrapedLeadsStateActions,
} from '@/query/leads.query';
import {
	useCreateLeadCategory,
	useGetLeadCategory,
} from '@/query/leadsCategory.query';
import {
	Search,
	MapPin,
	Building2,
	Phone,
	Star,
	Globe,
	Loader2,
	Save,
	CheckSquare,
	Square,
	Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SaveLeadsDialog from './CategoryDialog';

export default function LeadGeneratorPage() {
	const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
		new Set(),
	);
	const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
	const [selectedLeadCategoryId, setSelectedLeadCategoryId] = useState('');
	const [newCategoryTitle, setNewCategoryTitle] = useState('');
	const [newCategoryDescription, setNewCategoryDescription] = useState('');

	const { data: user } = useAuth();
	const { data: scrapedLeadsState } = useScrapedLeadsState();
	const { setState: setScrapedLeadsState, resetState: resetScrapedLeadsState } =
		useScrapedLeadsStateActions();
	const { data: savedLeadsResponse } = useLeads();
	const { data: leadCategoriesResponse } = useGetLeadCategory();
	const { mutate: scrapData, isPending: isScraping } = useScrapMapData();
	const { mutate: bulkCreate, isPending: isSaving } = useBulkCreateLeads();
	const { mutate: createCategory, isPending: isCreatingCategory } =
		useCreateLeadCategory();
	const { mutate: completeWalkthrough } = useCompleteWalkthrough();

	const business = scrapedLeadsState?.business ?? '';
	const location = scrapedLeadsState?.location ?? '';
	const leads = scrapedLeadsState?.leads ?? [];
	const page = scrapedLeadsState?.page ?? 1;
	const avgLat = scrapedLeadsState?.avgLat ?? null;
	const avgLng = scrapedLeadsState?.avgLng ?? null;
	const hasResults = leads.length > 0;

	const savedTitles = new Set(
		(savedLeadsResponse?.data || []).map((lead) => lead.title),
	);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const leadCategories = leadCategoriesResponse?.data || [];

	useEffect(() => {
		if (
			isSaveDialogOpen &&
			!selectedLeadCategoryId &&
			leadCategories.length === 1
		) {
			setSelectedLeadCategoryId(leadCategories[0]._id);
		}
	}, [isSaveDialogOpen, leadCategories, selectedLeadCategoryId]);

	const resetCategoryForm = () => {
		setNewCategoryTitle('');
		setNewCategoryDescription('');
	};

	const closeSaveDialog = () => {
		setIsSaveDialogOpen(false);
		resetCategoryForm();
	};

	const openSaveDialog = () => {
		if (selectedIndices.size === 0) {
			return;
		}

		setIsSaveDialogOpen(true);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		const queryBusiness = business.trim();
		const queryLocation = location.trim();

		if (!queryBusiness || !queryLocation) {
			toast.error('Business and Location are required.');
			return;
		}

		setSelectedIndices(new Set());
		setScrapedLeadsState((prev) => ({
			...prev,
			business: queryBusiness,
			location: queryLocation,
			leads: [],
			page: 1,
			avgLat: null,
			avgLng: null,
		}));

		scrapData(
			{ business: queryBusiness, location: queryLocation, page: 1 },
			{
				onSuccess: (data: ILeadScrapResult[]) => {
					let nextAvgLat: number | null = null;
					let nextAvgLng: number | null = null;

					if (data.length > 0) {
						const sumLat = data.reduce((acc, curr) => acc + curr.latitude, 0);
						const sumLng = data.reduce((acc, curr) => acc + curr.longitude, 0);
						nextAvgLat = Number((sumLat / data.length).toFixed(4));
						nextAvgLng = Number((sumLng / data.length).toFixed(4));
					}

					setScrapedLeadsState((prev) => ({
						...prev,
						business: queryBusiness,
						location: queryLocation,
						leads: data,
						page: 1,
						avgLat: nextAvgLat,
						avgLng: nextAvgLng,
					}));
				},
			},
		);
	};

	const handleLoadMore = () => {
		if (page >= 4 || avgLat === null || avgLng === null) return;

		const nextPage = page + 1;

		scrapData(
			{
				business,
				location,
				page: nextPage,
				latitude: avgLat,
				longitude: avgLng,
			},
			{
				onSuccess: (data: ILeadScrapResult[]) => {
					setScrapedLeadsState((prev) => ({
						...prev,
						leads: [...prev.leads, ...data],
						page: nextPage,
					}));
				},
			},
		);
	};

	const toggleSelection = (index: number, isAlreadySaved: boolean) => {
		if (isAlreadySaved) {
			toast.info('This lead is already saved. Use the dashboard to remove it.');
			return;
		}
		const newSet = new Set(selectedIndices);
		if (newSet.has(index)) newSet.delete(index);
		else newSet.add(index);
		setSelectedIndices(newSet);
	};

	const toggleAll = () => {
		const selectableIndices = leads
			.map((lead, idx) => ({ lead, idx }))
			.filter(({ lead }) => !savedTitles.has(lead.title))
			.map(({ idx }) => idx);

		if (
			selectedIndices.size === selectableIndices.length &&
			selectableIndices.length > 0
		) {
			setSelectedIndices(new Set());
		} else {
			setSelectedIndices(new Set(selectableIndices));
		}
	};

	const handleCreateCategory = () => {
		if (!user?.id) {
			toast.error('You need to be signed in to create a category.');
			return;
		}

		if (!newCategoryTitle.trim()) {
			toast.error('Category title is required.');
			return;
		}

		createCategory(
			{
				user: user.id,
				title: newCategoryTitle.trim(),
				description: newCategoryDescription.trim() || undefined,
			},
			{
				onSuccess: (response) => {
					if (response.data?._id) {
						setSelectedLeadCategoryId(response.data._id);
					}
					resetCategoryForm();
				},
			},
		);
	};

	const handleBulkSave = () => {
		if (selectedIndices.size === 0) return;

		if (!selectedLeadCategoryId) {
			toast.error('Select or create a lead category before saving.');
			return;
		}

		const selectedLeads = Array.from(selectedIndices).map((idx) => {
			const lead = leads[idx];
			const googleMapUrl = lead.placeId
				? `https://www.google.com/maps/place/?q=place_id:${lead.placeId}`
				: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.title + ' ' + lead.address)}`;

			return {
				position: lead.position,
				title: lead.title,
				address: lead.address,
				phone: lead.phoneNumber,
				website: lead.website,
				latitude: lead.latitude,
				longitude: lead.longitude,
				thumbnailUrl: lead.thumbnailUrl,
				rating: lead.rating,
				ratingCount: lead.ratingCount,
				googleMapUrl,
				leadCategory: selectedLeadCategoryId,
			};
		});

		bulkCreate(
			{ leads: selectedLeads as IBulkLeadInput[], user: user?.id },
			{
				onSuccess: () => {
					setSelectedIndices(new Set());
					closeSaveDialog();
				},
			},
		);
	};

	const handleClearResults = () => {
		setSelectedIndices(new Set());
		closeSaveDialog();
		resetScrapedLeadsState();
	};

	return (
		<div className='flex flex-1 flex-col h-full w-full bg-background overflow-hidden'>
			<div className='p-6 border-b border-border bg-card/50'>
				<div className='max-w-5xl mx-auto space-y-4'>
					<div className='flex items-center gap-3'>
						<div className='w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0'>
							<Building2 className='w-5 h-5' />
						</div>
						<div>
							<h2 className='text-xl font-bold tracking-tight text-foreground'>
								Lead Generator Setup
							</h2>
							<p className='text-sm text-muted-foreground'>
								Scrape Google Maps data by targeting a specific business type
								and geography.
							</p>
						</div>
					</div>

					<form
						onSubmit={handleSearch}
						className='flex items-center gap-4 mt-4'
					>
						<div className='flex items-center flex-1 bg-background border border-border rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all'>
							<Search className='w-4 h-4 text-muted-foreground mr-3' />
							<input
								type='text'
								placeholder='e.g., "restros", "dentists", "plumbers"'
								data-walkthrough='lead-type-input'
								className='flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50'
								value={business}
								onChange={(e) =>
									setScrapedLeadsState((prev) => ({
										...prev,
										business: e.target.value,
									}))
								}
							/>
						</div>

						<div className='flex items-center flex-1 bg-background border border-border rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all'>
							<MapPin className='w-4 h-4 text-muted-foreground mr-3' />
							<input
								type='text'
								placeholder='e.g., "new-york", "london", "10012"'
								data-walkthrough='lead-location-input'
								className='flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50'
								value={location}
								onChange={(e) =>
									setScrapedLeadsState((prev) => ({
										...prev,
										location: e.target.value,
									}))
								}
							/>
						</div>

						<button
							disabled={isScraping}
							type='submit'
							data-walkthrough='lead-mine-btn'
							className='bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
						>
							{isScraping ? (
								<>
									<Loader2 className='w-4 h-4 animate-spin' />
									Scraping...
								</>
							) : (
								<span>Start Mining</span>
							)}
						</button>

						{hasResults && (
							<button
								disabled={isScraping}
								type='button'
								onClick={handleClearResults}
								className='bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
							>
								Clear Results
							</button>
						)}
					</form>
				</div>
			</div>

			<div className='flex-1 overflow-y-auto relative bg-muted/20 pb-24'>
				<div className='max-w-5xl mx-auto p-6'>
					{leads.length > 0 ? (
						<div
							data-walkthrough='lead-results-list'
							className='bg-background border border-border rounded-xl shadow-sm overflow-hidden'
						>
							<div className='flex items-center justify-between p-4 border-b border-border bg-card/50'>
								<div className='flex items-center gap-3'>
									<button
										onClick={toggleAll}
										className='p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground'
									>
										{selectedIndices.size === leads.length ? (
											<CheckSquare className='w-5 h-5 text-primary' />
										) : (
											<Square className='w-5 h-5' />
										)}
									</button>
									<span className='font-medium text-sm'>
										{selectedIndices.size} of {leads.length} selected
									</span>
								</div>
							</div>

							<div className='divide-y divide-border'>
								{leads.map((lead, idx) => {
									const isAlreadySaved = savedTitles.has(lead.title);
									const isSelected = selectedIndices.has(idx) || isAlreadySaved;
									return (
										<div
											key={idx}
											className={cn(
												'flex items-start gap-4 p-4 hover:bg-accent/20 transition-colors',
												isSelected &&
													!isAlreadySaved &&
													'bg-primary/5 hover:bg-primary/10',
												isAlreadySaved && 'opacity-50 grayscale bg-muted/30',
											)}
										>
											<button
												className={cn(
													'mt-1 shrink-0 hover:text-foreground transition-colors',
													isAlreadySaved
														? 'cursor-not-allowed'
														: 'text-muted-foreground',
												)}
												onClick={() => toggleSelection(idx, isAlreadySaved)}
											>
												{isSelected ? (
													<CheckSquare
														className={cn(
															'w-5 h-5',
															isAlreadySaved
																? 'text-muted-foreground'
																: 'text-primary',
														)}
													/>
												) : (
													<Square className='w-5 h-5' />
												)}
											</button>

											{lead.thumbnailUrl && (
												<img
													src={lead.thumbnailUrl}
													alt={lead.title}
													referrerPolicy='no-referrer'
													className='w-16 h-16 rounded-lg object-cover border border-border shrink-0 bg-muted hidden sm:block'
												/>
											)}

											<div className='flex-1 min-w-0'>
												<div className='flex justify-between items-start gap-4'>
													<div>
														<h3 className='font-medium text-foreground text-base tracking-tight truncate'>
															{lead.title}
														</h3>
														<div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
															<span className='flex items-center gap-1 text-yellow-500 font-medium'>
																<Star className='w-3.5 h-3.5 fill-current' />
																{lead.rating}
															</span>
															<span>({lead.ratingCount} reviews)</span>
															{lead.type && (
																<>
																	<span className='opacity-50'>&bull;</span>
																	<span className='truncate'>{lead.type}</span>
																</>
															)}
															{lead.priceLevel && (
																<>
																	<span className='opacity-50'>&bull;</span>
																	<span>{lead.priceLevel}</span>
																</>
															)}
														</div>
													</div>

													<div className='flex items-center gap-2 shrink-0'>
														{lead.website && (
															<a
																href={lead.website}
																target='_blank'
																rel='noreferrer'
																className='p-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors'
																title='Visit Website'
															>
																<Globe className='w-4 h-4' />
															</a>
														)}
														{lead.placeId && (
															<a
																href={`https://www.google.com/maps/place/?q=place_id:${lead.placeId}`}
																target='_blank'
																rel='noreferrer'
																className='p-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors'
																title='View on Google Maps'
															>
																<Navigation className='w-4 h-4' />
															</a>
														)}
													</div>
												</div>

												<div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-foreground/80'>
													<div className='flex items-center gap-2'>
														<MapPin className='w-4 h-4 text-muted-foreground shrink-0' />
														<span className='truncate'>{lead.address}</span>
													</div>
													{lead.phoneNumber && (
														<div className='flex items-center gap-2'>
															<Phone className='w-4 h-4 text-muted-foreground shrink-0' />
															<span>{lead.phoneNumber}</span>
														</div>
													)}
												</div>
											</div>
										</div>
									);
								})}
							</div>

							{leads.length > 0 && page < 4 && (
								<div className='flex justify-center p-6 border-t border-border bg-card/30'>
									<button
										onClick={handleLoadMore}
										disabled={isScraping}
										className='bg-secondary text-secondary-foreground hover:bg-secondary/80 px-8 py-2.5 rounded-full text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
									>
										{isScraping ? (
											<>
												<Loader2 className='w-4 h-4 animate-spin' />
												Loading more leads...
											</>
										) : (
											'Load More'
										)}
									</button>
								</div>
							)}
						</div>
					) : (
						!isScraping && (
							<div className='flex flex-col items-center justify-center p-12 text-center max-w-sm mx-auto opacity-50 space-y-4'>
								<div className='w-16 h-16 rounded-full bg-accent flex items-center justify-center'>
									<Search className='w-8 h-8 text-muted-foreground' />
								</div>
								<div>
									<h3 className='font-medium text-lg'>No Leads Found</h3>
									<p className='text-sm text-muted-foreground mt-1'>
										Enter a business category and location above to start
										scraping potential leads.
									</p>
								</div>
							</div>
						)
					)}
				</div>
			</div>

			{selectedIndices.size > 0 && (
				<div className='absolute bottom-6 left-1/2 -translate-x-1/2 bg-card text-card-foreground border border-border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-8 fade-in duration-300 z-10'>
					<span className='font-medium text-sm'>
						<span className='text-primary mr-1'>{selectedIndices.size}</span>
						leads selected
					</span>
					<div className='w-px h-6 bg-border' />
					<button
						disabled={isSaving}
						onClick={openSaveDialog}
						data-walkthrough='lead-save-btn'
						className='bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full text-sm font-medium shadow-sm transition-all flex items-center gap-2 whitespace-nowrap'
					>
						<Save className='w-4 h-4' />
						Save to CRM
					</button>
				</div>
			)}

			{isSaveDialogOpen && (
				<SaveLeadsDialog
					selectedIndices={selectedIndices}
					leadCategories={leadCategories}
					isSaving={isSaving}
					isCreatingCategory={isCreatingCategory}
					selectedLeadCategoryId={selectedLeadCategoryId}
					setSelectedLeadCategoryId={setSelectedLeadCategoryId}
					newCategoryTitle={newCategoryTitle}
					setNewCategoryTitle={setNewCategoryTitle}
					newCategoryDescription={newCategoryDescription}
					setNewCategoryDescription={setNewCategoryDescription}
					closeSaveDialog={() => setIsSaveDialogOpen(false)}
					handleCreateCategory={handleCreateCategory}
					handleBulkSave={handleBulkSave}
				/>
			)}
			<Walkthrough
				steps={[
					{
						title: 'Welcome to Lead Generator!',
						content:
							'This tool helps you find potential customers directly from Google Maps. Let’s see how it works.',
					},
					{
						target: '[data-walkthrough="lead-type-input"]',
						title: 'What are you looking for?',
						content:
							'Enter the type of business you want to target, like "restaurants", "dentists", or "gyms".',
					},
					{
						target: '[data-walkthrough="lead-location-input"]',
						title: 'Where to look?',
						content:
							'Specify the city, zip code, or country where you want to find these businesses.',
					},
					{
						target: '[data-walkthrough="lead-mine-btn"]',
						title: 'Start Mining',
						content:
							'Click here to begin the scraping process. We will fetch the top results for you.',
					},
					{
						target: '[data-walkthrough="lead-history-link"]',
						title: 'Manage Your Leads',
						content:
							'Once you save leads, you can manage them and start your outreach from the CRM section.',
					},
				]}
				onComplete={() => completeWalkthrough('lead-generation')}
				isVisible={!user?.completedWalkthroughs?.includes('lead-generation')}
			/>
		</div>
	);
}
