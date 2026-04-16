'use client';

import { useState, useEffect, useRef } from 'react';
import {
	User,
	Lock,
	Calendar,
	Mail,
	Globe,
	Settings,
	Building,
	MessageCircle,
	ChevronRight,
} from 'lucide-react';
import {
	useAuth,
	useUpdateProfile,
	useChangePassword,
} from '@/query/auth.query';
import {
	useWhatsAppStatus,
	useWhatsAppStart,
	useWhatsAppLogout,
} from '@/query/whatsapp.query';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const LANGUAGES = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja'];
const TIMEZONES = [
	'UTC',
	'America/New_York',
	'America/Chicago',
	'America/Denver',
	'America/Los_Angeles',
	'Europe/London',
	'Europe/Paris',
	'Europe/Berlin',
	'Asia/Tokyo',
	'Asia/Shanghai',
	'Asia/Singapore',
	'Australia/Sydney',
];

export default function ProfilePage() {
	const { data: user, isLoading } = useAuth();
	const updateProfile = useUpdateProfile();
	const changePassword = useChangePassword();

	const statusQuery = useWhatsAppStatus();
	const startMutation = useWhatsAppStart();
	const logoutMutation = useWhatsAppLogout();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [companyName, setCompanyName] = useState('');
	const [companySize, setCompanySize] = useState('');
	const [jobTitle, setJobTitle] = useState('');
	const [website, setWebsite] = useState('');
	const [linkedinUrl, setLinkedinUrl] = useState('');
	const [timezone, setTimezone] = useState('');
	const [language, setLanguage] = useState('');
	const [emailNotifications, setEmailNotifications] = useState(true);

	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [activeSection, setActiveSection] = useState('personal');
	const hasAutoStartedQR = useRef(false);

	useEffect(() => {
		if (
			activeSection === 'whatsapp' &&
			statusQuery.data?.state === 'DISCONNECTED' &&
			!hasAutoStartedQR.current
		) {
			hasAutoStartedQR.current = true;
			handleStartConnection();
		} else if (activeSection !== 'whatsapp') {
			hasAutoStartedQR.current = false;
		}
	}, [activeSection, statusQuery.data?.state]);

	useEffect(() => {
		if (user) {
			setName(user.userName || '');
			setEmail(user.email || '');
			setPhoneNumber(user.phoneNumber || '');
			setCompanyName(user.companyName || '');
			setCompanySize(user.companySize || '');
			setJobTitle(user.jobTitle || '');
			setWebsite(user.website || '');
			setLinkedinUrl(user.linkedinUrl || '');
			setTimezone(user.timezone || 'UTC');
			setLanguage(user.language || 'en');
			setEmailNotifications(user.emailNotifications ?? true);
		}
	}, [user]);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-96'>
				<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary' />
			</div>
		);
	}

	if (!user) return null;

	const handleSaveProfile = () => {
		updateProfile.mutate(
			{
				userName: name,
				email,
				phoneNumber,
				companyName,
				companySize,
				jobTitle,
				website,
				linkedinUrl,
				timezone,
				language,
				emailNotifications,
			},
			{
				onSuccess: () => {
					toast.success('Profile updated');
				},
			},
		);
	};

	const handleChangePassword = () => {
		if (newPassword !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}
		if (newPassword.length < 8) {
			toast.error('Password must be at least 8 characters');
			return;
		}
		changePassword.mutate(
			{ currentPassword, newPassword },
			{
				onSuccess: () => {
					setCurrentPassword('');
					setNewPassword('');
					setConfirmPassword('');
					toast.success('Password changed successfully');
				},
			},
		);
	};

	const handleStartConnection = () => {
		startMutation.mutate(undefined, {
			onError: () => {
				toast.error('Failed to start WhatsApp connection');
			},
		});
	};

	const handleDisconnect = () => {
		if (confirm('Are you sure you want to disconnect WhatsApp?')) {
			logoutMutation.mutate(undefined, {
				onSuccess: () => {
					toast.success('WhatsApp disconnected');
				},
			});
		}
	};

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const sections = [
		{ id: 'personal', label: 'Personal', icon: User },
		{ id: 'company', label: 'Company', icon: Building },
		{ id: 'web', label: 'Web Presence', icon: Globe },
		{ id: 'preferences', label: 'Preferences', icon: Settings },
		{ id: 'security', label: 'Security', icon: Lock },
		{ id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
		{ id: 'account', label: 'Account', icon: Mail },
	];

	return (
		<div className='max-w-5xl mx-auto space-y-8 p-4 md:p-8 font-sans'>
			<header className='space-y-1'>
				<h1 className='text-2xl font-semibold tracking-tight text-foreground'>
					Profile Settings
				</h1>
				<p className='text-sm text-muted-foreground'>
					Manage your identity, company profile, and workspace preferences.
				</p>
			</header>

			<div className='flex flex-col md:flex-row gap-8 items-start'>
				<nav className='w-full md:w-56 shrink-0 flex flex-col gap-1'>
					{sections.map((section) => {
						const Icon = section.icon;
						const isActive = activeSection === section.id;
						return (
							<button
								key={section.id}
								onClick={() => setActiveSection(section.id)}
								className={`
                                    group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-xl 
                                    transition-all duration-200 active:scale-95
                                    ${
																			isActive
																				? 'bg-primary text-primary-foreground shadow-sm'
																				: 'text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm'
																		}
                                `}
							>
								<span className='flex items-center gap-2.5'>
									<Icon
										size={16}
										strokeWidth={isActive ? 2.5 : 2}
									/>
									{section.label}
								</span>
								{isActive && (
									<ChevronRight
										size={14}
										className='opacity-70'
									/>
								)}
							</button>
						);
					})}
				</nav>

				<main className='flex-1 w-full min-w-0'>
					<div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all duration-200'>
						{/* Render Header Section dynamically */}
						<div className='px-6 py-4 border-b border-border bg-background/50'>
							<h2 className='text-sm font-semibold flex items-center gap-2 uppercase tracking-wider opacity-80'>
								{sections.find((s) => s.id === activeSection)?.label}{' '}
								Information
							</h2>
						</div>

						<div className='p-6'>
							{activeSection === 'personal' && (
								<div className='space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300'>
									<div className='grid gap-4 sm:grid-cols-2'>
										<div className='space-y-1.5'>
											<label className='text-xs font-medium text-muted-foreground'>
												Username
											</label>
											<Input
												value={name}
												onChange={(e) => setName(e.target.value)}
												placeholder='johndoe'
												className='rounded-xl border-border bg-background/50 focus:bg-background transition-all'
											/>
										</div>
										<div className='space-y-1.5'>
											<label className='text-xs font-medium text-muted-foreground'>
												Phone Number
											</label>
											<Input
												type='tel'
												value={phoneNumber}
												onChange={(e) => setPhoneNumber(e.target.value)}
												placeholder='+1 (555) 000-0000'
												className='rounded-xl border-border bg-background/50 focus:bg-background transition-all'
											/>
										</div>
									</div>
									<div className='space-y-1.5'>
										<label className='text-xs font-medium text-muted-foreground'>
											Email Address
										</label>
										<Input
											type='email'
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder='john@example.com'
											className='rounded-xl border-border bg-background/50 focus:bg-background transition-all'
										/>
									</div>
									<div className='pt-2'>
										<button
											onClick={handleSaveProfile}
											disabled={updateProfile.isPending}
											className='px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-95 disabled:opacity-50'
										>
											{updateProfile.isPending ? 'Saving...' : 'Save Profile'}
										</button>
									</div>
								</div>
							)}

							{activeSection === 'company' && (
								<div className='space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300'>
									<div className='space-y-1.5'>
										<label className='text-xs font-medium text-muted-foreground'>
											Company Name
										</label>
										<Input
											value={companyName}
											onChange={(e) => setCompanyName(e.target.value)}
											placeholder='Acme Corp'
											className='rounded-xl'
										/>
									</div>
									<div className='grid gap-4 sm:grid-cols-2'>
										<div className='space-y-1.5'>
											<label className='text-xs font-medium text-muted-foreground'>
												Company Size
											</label>
											<select
												value={companySize}
												onChange={(e) => setCompanySize(e.target.value)}
												className='flex h-9 w-full rounded-xl border border-border bg-background px-3 py-1 text-sm transition-all focus:ring-2 focus:ring-primary/20'
											>
												<option value=''>Select size</option>
												{COMPANY_SIZES.map((size) => (
													<option
														key={size}
														value={size}
													>
														{size} employees
													</option>
												))}
											</select>
										</div>
										<div className='space-y-1.5'>
											<label className='text-xs font-medium text-muted-foreground'>
												Job Title
											</label>
											<Input
												value={jobTitle}
												onChange={(e) => setJobTitle(e.target.value)}
												placeholder='Product Designer'
												className='rounded-xl'
											/>
										</div>
									</div>
									<div className='pt-2'>
										<button
											onClick={handleSaveProfile}
											disabled={updateProfile.isPending}
											className='px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold transition-all active:scale-95'
										>
											Save Company Data
										</button>
									</div>
								</div>
							)}

							{activeSection === 'web' && (
								<div className='space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300'>
									<div className='space-y-1.5'>
										<label className='text-xs font-medium text-muted-foreground'>
											Website
										</label>
										<Input
											value={website}
											onChange={(e) => setWebsite(e.target.value)}
											placeholder='https://company.com'
											className='rounded-xl'
										/>
									</div>
									<div className='space-y-1.5'>
										<label className='text-xs font-medium text-muted-foreground'>
											LinkedIn Profile
										</label>
										<Input
											value={linkedinUrl}
											onChange={(e) => setLinkedinUrl(e.target.value)}
											placeholder='https://linkedin.com/in/user'
											className='rounded-xl'
										/>
									</div>
									<div className='pt-2'>
										<button
											onClick={handleSaveProfile}
											className='px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold transition-all active:scale-95'
										>
											Update Links
										</button>
									</div>
								</div>
							)}

							{activeSection === 'preferences' && (
								<div className='space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300'>
									<div className='grid gap-4 sm:grid-cols-2'>
										<div className='space-y-1.5'>
											<label className='text-xs font-medium text-muted-foreground'>
												Timezone
											</label>
											<select
												value={timezone}
												onChange={(e) => setTimezone(e.target.value)}
												className='flex h-9 w-full rounded-xl border border-border bg-background px-3 py-1 text-sm'
											>
												{TIMEZONES.map((tz) => (
													<option
														key={tz}
														value={tz}
													>
														{tz}
													</option>
												))}
											</select>
										</div>
										<div className='space-y-1.5'>
											<label className='text-xs font-medium text-muted-foreground'>
												Language
											</label>
											<select
												value={language}
												onChange={(e) => setLanguage(e.target.value)}
												className='flex h-9 w-full rounded-xl border border-border bg-background px-3 py-1 text-sm'
											>
												{LANGUAGES.map((lang) => (
													<option
														key={lang}
														value={lang}
													>
														{lang.toUpperCase()}
													</option>
												))}
											</select>
										</div>
									</div>
									<label className='flex items-center gap-3 p-3 rounded-xl border border-border bg-background/30 hover:bg-background/50 transition-colors cursor-pointer'>
										<input
											type='checkbox'
											checked={emailNotifications}
											onChange={(e) => setEmailNotifications(e.target.checked)}
											className='w-4 h-4 rounded border-border text-primary focus:ring-primary transition-all'
										/>
										<span className='text-sm text-foreground'>
											Enable email notifications
										</span>
									</label>
									<div className='pt-2'>
										<button
											onClick={handleSaveProfile}
											className='px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold transition-all active:scale-95'
										>
											Save Preferences
										</button>
									</div>
								</div>
							)}

							{activeSection === 'security' && (
								<div className='space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300'>
									<div className='space-y-1.5'>
										<label className='text-xs font-medium text-muted-foreground'>
											Current Password
										</label>
										<Input
											type='password'
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
											className='rounded-xl'
										/>
									</div>
									<div className='grid gap-4 sm:grid-cols-2'>
										<div className='space-y-1.5'>
											<label className='text-xs font-medium text-muted-foreground'>
												New Password
											</label>
											<Input
												type='password'
												value={newPassword}
												onChange={(e) => setNewPassword(e.target.value)}
												className='rounded-xl'
											/>
										</div>
										<div className='space-y-1.5'>
											<label className='text-xs font-medium text-muted-foreground'>
												Confirm New Password
											</label>
											<Input
												type='password'
												value={confirmPassword}
												onChange={(e) => setConfirmPassword(e.target.value)}
												className='rounded-xl'
											/>
										</div>
									</div>
									<div className='pt-2'>
										<button
											onClick={handleChangePassword}
											disabled={
												changePassword.isPending ||
												!currentPassword ||
												!newPassword ||
												!confirmPassword
											}
											className='px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50'
										>
											{changePassword.isPending
												? 'Updating...'
												: 'Change Password'}
										</button>
									</div>
								</div>
							)}

							{activeSection === 'whatsapp' && (
								<div className='animate-in fade-in slide-in-from-bottom-2 duration-300'>
									{statusQuery.isLoading ? (
										<div className='flex items-center justify-center py-12'>
											<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary' />
										</div>
									) : statusQuery.data?.state === 'CONNECTED' ? (
										<div className='space-y-6'>
											<div className='flex items-center gap-4 p-4 bg-green-500/5 rounded-xl border border-green-500/20'>
												<div className='relative'>
													<div className='w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-600'>
														<MessageCircle size={24} />
													</div>
													<div className='absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-card rounded-full' />
												</div>
												<div className='flex-1'>
													<p className='text-sm font-semibold text-foreground'>
														Active Connection
													</p>
													<p className='text-xs text-muted-foreground font-mono'>
														{statusQuery.data.phoneNumber}
													</p>
												</div>
											</div>
											<button
												onClick={handleDisconnect}
												disabled={logoutMutation.isPending}
												className='px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-95'
											>
												{logoutMutation.isPending
													? 'Disconnecting...'
													: 'Terminate Connection'}
											</button>
										</div>
									) : (
										<div className='flex flex-col items-center py-4 space-y-4'>
											<div className='w-full max-w-[280px] p-6 bg-background rounded-xl border border-border border-dashed text-center space-y-4'>
												{statusQuery.data?.state === 'AWAITING_SCAN' &&
												statusQuery.data.qr ? (
													<>
														<p className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>
															Scan to Connect
														</p>
														<div className='p-2 bg-white rounded-lg inline-block shadow-sm'>
															<img
																src={statusQuery.data.qr}
																alt='QR'
																className='w-40 h-40'
															/>
														</div>
														<p className='text-[10px] text-muted-foreground italic'>
															Refreshes every 3s
														</p>
													</>
												) : (
													<div className='py-8 flex flex-col items-center space-y-3'>
														<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-primary' />
														<p className='text-xs text-muted-foreground'>
															Establishing secure link...
														</p>
													</div>
												)}
											</div>
										</div>
									)}
								</div>
							)}

							{activeSection === 'account' && (
								<div className='grid gap-6 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300'>
									<div className='p-4 bg-background/50 rounded-xl border border-border space-y-1'>
										<p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
											Access Level
										</p>
										<p className='text-sm font-semibold text-foreground capitalize'>
											{user.role}
										</p>
									</div>
									<div className='p-4 bg-background/50 rounded-xl border border-border space-y-1'>
										<p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
											Active Plan
										</p>
										<p className='text-sm font-semibold text-primary capitalize'>
											{user.subscriptionPlan || 'Free'}
										</p>
									</div>
									<div className='p-4 bg-background/50 rounded-xl border border-border space-y-1'>
										<p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1'>
											<Calendar size={10} /> Joined Date
										</p>
										<p className='text-sm font-semibold text-foreground'>
											{formatDate(user.createdAt)}
										</p>
									</div>
									<div className='p-4 bg-background/50 rounded-xl border border-border space-y-1'>
										<p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
											Usage Stats
										</p>
										<p className='text-sm font-semibold text-foreground'>
											{user.loginCount || 0} Sessions
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
