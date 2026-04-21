'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Save, Plus, Check, ChevronsUpDown, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateLead, useCreateLead } from '@/query/leads.query';
import { useGetLeadCategory, useCreateLeadCategory } from '@/query/leadsCategory.query';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
	isOpen: boolean;
	onClose: () => void;
	lead?: ILead | null;
	onCreated?: () => void;
};

export default function EditLeadDialog({ isOpen, onClose, lead, onCreated }: Props) {
	const [formData, setFormData] = useState({
		title: '',
		phone: '',
		website: '',
		address: '',
		category: '',
		googleMapUrl: '',
		note: '',
		latitude: '',
		longitude: '',
		rating: '',
		ratingCount: '',
	});

	const updateMutation = useUpdateLead();
	const createMutation = useCreateLead();
	const { data: categoriesResponse } = useGetLeadCategory();
	const createCategoryMutation = useCreateLeadCategory();

	const isCreateMode = !lead;
	const categories = categoriesResponse?.data || [];

	const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState('');

	const resetForm = () => {
		setFormData({
			title: '',
			phone: '',
			website: '',
			address: '',
			category: '',
			googleMapUrl: '',
			note: '',
			latitude: '',
			longitude: '',
			rating: '',
			ratingCount: '',
		});
		setIsNewCategoryOpen(false);
		setNewCategoryName('');
	};

	useEffect(() => {
		if (lead) {
			setFormData({
				title: lead.title || '',
				phone: lead.phone || '',
				website: lead.website || '',
				address: lead.address || '',
				category: lead.category || '',
				googleMapUrl: lead.googleMapUrl || '',
				note: lead.note || '',
				latitude: lead.latitude?.toString() || '',
				longitude: lead.longitude?.toString() || '',
				rating: lead.rating?.toString() || '',
				ratingCount: lead.ratingCount?.toString() || '',
			});
		} else {
			resetForm();
		}
	}, [lead, isOpen]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const buildLeadData = () => {
		const data: Record<string, unknown> = {};

		if (formData.title.trim()) {
			data.title = formData.title.trim();
		} else {
			data.title = null;
		}

		if (formData.phone.trim()) {
			data.phone = formData.phone.trim();
		} else {
			data.phone = null;
		}

		if (formData.website.trim()) {
			data.website = formData.website.trim();
		} else {
			data.website = null;
		}

		if (formData.address.trim()) {
			data.address = formData.address.trim();
		} else {
			data.address = null;
		}

		if (formData.category.trim()) {
			data.category = formData.category.trim();
		} else {
			data.category = null;
		}

		if (formData.googleMapUrl.trim()) {
			data.googleMapUrl = formData.googleMapUrl.trim();
		} else {
			data.googleMapUrl = null;
		}

		if (formData.note.trim()) {
			data.note = formData.note.trim();
		} else {
			data.note = null;
		}

		if (formData.latitude.trim()) {
			data.latitude = parseFloat(formData.latitude);
		} else {
			data.latitude = null;
		}

		if (formData.longitude.trim()) {
			data.longitude = parseFloat(formData.longitude);
		} else {
			data.longitude = null;
		}

		if (formData.rating.trim()) {
			data.rating = parseFloat(formData.rating);
		} else {
			data.rating = null;
		}

		if (formData.ratingCount.trim()) {
			data.ratingCount = parseInt(formData.ratingCount, 10);
		} else {
			data.ratingCount = null;
		}

		return data;
	};

	const handleSave = async () => {
		if (isCreateMode) {
			try {
				await createMutation.mutateAsync(buildLeadData() as unknown as Omit<ILead, '_id'>);
				onClose();
				resetForm();
				onCreated?.();
			} catch (error) {
				console.error('Failed to create lead:', error);
			}
		} else {
			if (!lead?._id) return;
			try {
				await updateMutation.mutateAsync({ leadId: lead._id, data: buildLeadData() as unknown as Partial<ILead> });
				onClose();
			} catch (error) {
				console.error('Failed to update lead:', error);
			}
		}
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center'>
			<div
				className='absolute inset-0 bg-black/50'
				onClick={onClose}
			/>
			<div className='relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl mx-4'>
				<div className='flex items-center justify-between mb-6'>
					<h2 className='text-xl font-semibold'>
						{isCreateMode ? 'Create New Lead' : 'Edit Lead'}
					</h2>
					<Button
						variant='ghost'
						size='icon'
						onClick={onClose}
						className='rounded-full'
					>
						<X size={16} />
					</Button>
				</div>

				<div className='space-y-4'>
					<div>
						<label className='text-sm font-medium text-muted-foreground'>
							Title
						</label>
						<Input
							name='title'
							value={formData.title}
							onChange={handleChange}
							placeholder='Lead title'
							className='mt-1'
						/>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>
								Phone
							</label>
							<Input
								name='phone'
								value={formData.phone}
								onChange={handleChange}
								placeholder='Phone number'
								className='mt-1'
							/>
						</div>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>
								Website
							</label>
							<Input
								name='website'
								value={formData.website}
								onChange={handleChange}
								placeholder='Website URL'
								className='mt-1'
							/>
						</div>
					</div>

					<div>
						<label className='text-sm font-medium text-muted-foreground'>
							Address
						</label>
						<Input
							name='address'
							value={formData.address}
							onChange={handleChange}
							placeholder='Address'
							className='mt-1'
						/>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>
								Category
							</label>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='outline'
										className='mt-1 w-full justify-between font-normal'
									>
										{formData.category || 'Select category'}
										<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='start' className='w-[300px] p-2 rounded-2xl border border-border/50 shadow-xl'>
									<DropdownMenuLabel className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2 mt-1'>
										Select Category
									</DropdownMenuLabel>
									{categories.map((cat: ILeadCategory) => (
										<DropdownMenuItem
											key={cat._id}
											onSelect={(e) => {
												e.preventDefault();
												setFormData((prev) => ({
													...prev,
													category: cat.title,
												}));
											}}
											className='cursor-pointer'
										>
											{formData.category === cat.title && (
												<Check className='mr-2 h-4 w-4' />
											)}
											{cat.title}
										</DropdownMenuItem>
									))}
									<DropdownMenuSeparator className='my-2' />
									<DropdownMenuItem
										onClick={() => setIsNewCategoryOpen(true)}
										className='cursor-pointer text-primary'
									>
										<FolderPlus className='mr-2 h-4 w-4' />
										Create New Category
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							{isNewCategoryOpen && (
								<div className='mt-2 flex gap-2'>
									<Input
										value={newCategoryName}
										onChange={(e) => setNewCategoryName(e.target.value)}
										placeholder='New category name'
										className='flex-1'
										autoFocus
										onKeyDown={(e) => {
											if (e.key === 'Enter' && newCategoryName.trim()) {
												createCategoryMutation.mutate(
													{ title: newCategoryName.trim() },
													{
														onSuccess: (res) => {
															setFormData((prev) => ({
																...prev,
																category: newCategoryName.trim(),
															}));
															setIsNewCategoryOpen(false);
															setNewCategoryName('');
														},
													},
												);
											} else if (e.key === 'Escape') {
												setIsNewCategoryOpen(false);
												setNewCategoryName('');
											}
										}}
									/>
									<Button
										size='sm'
										onClick={() => {
											if (newCategoryName.trim()) {
												createCategoryMutation.mutate(
													{ title: newCategoryName.trim() },
													{
														onSuccess: () => {
															setFormData((prev) => ({
																...prev,
																category: newCategoryName.trim(),
															}));
															setIsNewCategoryOpen(false);
															setNewCategoryName('');
														},
													},
												);
											}
										}}
									>
										Add
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => {
											setIsNewCategoryOpen(false);
											setNewCategoryName('');
										}}
									>
										Cancel
									</Button>
								</div>
							)}
						</div>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>
								Google Map URL
							</label>
							<Input
								name='googleMapUrl'
								value={formData.googleMapUrl}
								onChange={handleChange}
								placeholder='Google Maps link'
								className='mt-1'
							/>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>
								Latitude
							</label>
							<Input
								name='latitude'
								type='number'
								step='any'
								value={formData.latitude}
								onChange={handleChange}
								placeholder='Latitude'
								className='mt-1'
							/>
						</div>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>
								Longitude
							</label>
							<Input
								name='longitude'
								type='number'
								step='any'
								value={formData.longitude}
								onChange={handleChange}
								placeholder='Longitude'
								className='mt-1'
							/>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>
								Rating
							</label>
							<Input
								name='rating'
								type='number'
								step='0.1'
								value={formData.rating}
								onChange={handleChange}
								placeholder='Rating'
								className='mt-1'
							/>
						</div>
						<div>
							<label className='text-sm font-medium text-muted-foreground'>
								Rating Count
							</label>
							<Input
								name='ratingCount'
								type='number'
								value={formData.ratingCount}
								onChange={handleChange}
								placeholder='Rating count'
								className='mt-1'
							/>
						</div>
					</div>

					<div>
						<label className='text-sm font-medium text-muted-foreground'>
							Note
						</label>
						<Textarea
							name='note'
							value={formData.note}
							onChange={handleChange}
							placeholder='Add a note...'
							className='mt-1 min-h-[100px]'
						/>
					</div>
				</div>

				<div className='mt-6 flex justify-end gap-2'>
					<Button variant='outline' onClick={onClose}>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={updateMutation.isPending || createMutation.isPending}
					>
						{(updateMutation.isPending || createMutation.isPending) && (
							<Loader2
								size={16}
								className='mr-2 animate-spin'
							/>
						)}
						{isCreateMode ? (
							<>
								<Plus size={16} className='mr-2' />
								Create Lead
							</>
						) : (
							<>
								<Save size={16} className='mr-2' />
								Save Changes
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}