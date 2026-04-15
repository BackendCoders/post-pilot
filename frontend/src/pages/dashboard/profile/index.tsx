'use client';

import { useState, useEffect } from 'react';
import {
	User,
	Lock,
	Calendar,
	Mail,
	Briefcase,
	Globe,
	Settings,
	Building,
	Link as LinkIcon,
	MessageCircle,
} from 'lucide-react';
import { useAuth, useUpdateProfile, useChangePassword } from '@/query/auth.query';
import { useWhatsAppStatus, useWhatsAppQR, useWhatsAppLogout } from '@/query/whatsapp.query';
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
	const qrMutation = useWhatsAppQR();
	const logoutMutation = useWhatsAppLogout();

	const [qrData, setQrData] = useState<string | null>(null);
	const [countdown, setCountdown] = useState(20);

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

	useEffect(() => {
		if (qrData) {
			const timer = setInterval(() => {
				setCountdown((prev) => {
					if (prev <= 1) {
						startQR();
						return 20;
					}
					return prev - 1;
				});
			}, 1000);

			return () => clearInterval(timer);
		}
	}, [qrData]);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
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
			}
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
			}
		);
	};

	const startQR = () => {
		setCountdown(20);
		qrMutation.mutate(undefined, {
			onSuccess: () => {
				setQrData(null);
				statusQuery.refetch();
			},
			onError: () => {
				toast.error('Failed to generate QR code');
			},
		});
	};

	const handleQR = (event: { qr?: string; timeout?: boolean; error?: string }) => {
		if (event.qr) {
			setQrData(event.qr);
		}
		if (event.timeout) {
			startQR();
		}
		if (event.error) {
			toast.error(event.error);
		}
	};

	const handleDisconnect = () => {
		if (confirm('Are you sure you want to disconnect WhatsApp?')) {
			logoutMutation.mutate(undefined, {
				onSuccess: () => {
					toast.success('WhatsApp disconnected');
					setQrData(null);
				},
			});
		}
	};

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
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
		<div className='max-w-4xl mx-auto space-y-6'>
			<header>
				<h1 className='text-2xl font-semibold tracking-tight'>Profile Settings</h1>
				<p className='text-muted-foreground mt-1'>
					Manage your account information and preferences
				</p>
			</header>

			<div className='flex gap-6'>
				<nav className='w-48 shrink-0'>
					<div className='border border-border rounded-lg bg-card overflow-hidden'>
						<div className='divide-y divide-border'>
							{sections.map((section) => {
								const Icon = section.icon;
								return (
									<button
										key={section.id}
										onClick={() => setActiveSection(section.id)}
										className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
											activeSection === section.id
												? 'bg-primary/10 text-primary'
												: 'text-muted-foreground hover:bg-muted hover:text-foreground'
										}`}
									>
										<Icon size={18} />
										{section.label}
									</button>
								);
							})}
						</div>
					</div>
				</nav>

				<div className='flex-1 space-y-6'>
					{activeSection === 'personal' && (
						<section className='border border-border rounded-lg bg-card overflow-hidden'>
							<div className='px-6 py-4 border-b border-border bg-card/50'>
								<h2 className='font-medium flex items-center gap-2'>
									<User size={18} />
									Personal Information
								</h2>
							</div>

							<div className='p-6 space-y-4'>
								<div className='grid gap-2'>
									<label className='text-sm font-medium'>Username</label>
									<Input
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder='Enter your username'
									/>
								</div>

								<div className='grid gap-2'>
									<label className='text-sm font-medium'>Email</label>
									<Input
										type='email'
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder='Enter your email'
									/>
								</div>

								<div className='grid gap-2'>
									<label className='text-sm font-medium'>Phone Number</label>
									<Input
										type='tel'
										value={phoneNumber}
										onChange={(e) => setPhoneNumber(e.target.value)}
										placeholder='Enter your phone number'
									/>
								</div>

								<div className='pt-2'>
									<button
										onClick={handleSaveProfile}
										disabled={updateProfile.isPending}
										className='px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity50'
									>
										{updateProfile.isPending ? 'Saving...' : 'Save Changes'}
									</button>
								</div>
							</div>
						</section>
					)}

					{activeSection === 'company' && (
						<section className='border border-border rounded-lg bg-card overflow-hidden'>
							<div className='px-6 py-4 border-b border-border bg-card/50'>
								<h2 className='font-medium flex items-center gap-2'>
									<Building size={18} />
									Company Information
								</h2>
							</div>

							<div className='p-6 space-y-4'>
								<div className='grid gap-2'>
									<label className='text-sm font-medium'>Company Name</label>
									<Input
										value={companyName}
										onChange={(e) => setCompanyName(e.target.value)}
										placeholder='Enter company name'
									/>
								</div>

								<div className='grid gap-2'>
									<label className='text-sm font-medium'>Company Size</label>
									<select
										value={companySize}
										onChange={(e) => setCompanySize(e.target.value)}
										className='h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm'
									>
										<option value=''>Select company size</option>
										{COMPANY_SIZES.map((size) => (
											<option key={size} value={size}>
												{size} employees
											</option>
										))}
									</select>
								</div>

								<div className='grid gap-2'>
									<label className='text-sm font-medium'>Job Title</label>
									<Input
										value={jobTitle}
										onChange={(e) => setJobTitle(e.target.value)}
										placeholder='Enter your job title'
									/>
								</div>

								<div className='pt-2'>
									<button
										onClick={handleSaveProfile}
										disabled={updateProfile.isPending}
										className='px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity50'
									>
										{updateProfile.isPending ? 'Saving...' : 'Save Changes'}
									</button>
								</div>
							</div>
						</section>
					)}

					{activeSection === 'web' && (
						<section className='border border-border rounded-lg bg-card overflow-hidden'>
							<div className='px-6 py-4 border-b border-border bg-card/50'>
								<h2 className='font-medium flex items-center gap-2'>
									<Globe size={18} />
									Web Presence
								</h2>
							</div>

							<div className='p-6 space-y-4'>
								<div className='grid gap-2'>
									<label className='text-sm font-medium'>Website</label>
									<Input
										value={website}
										onChange={(e) => setWebsite(e.target.value)}
										placeholder='https://your-website.com'
									/>
								</div>

								<div className='grid gap-2'>
									<label className='text-sm font-medium'>LinkedIn Profile</label>
									<Input
										value={linkedinUrl}
										onChange={(e) => setLinkedinUrl(e.target.value)}
										placeholder='https://linkedin.com/in/your-profile'
									/>
								</div>

								<div className='pt-2'>
									<button
										onClick={handleSaveProfile}
										disabled={updateProfile.isPending}
										className='px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity50'
									>
										{updateProfile.isPending ? 'Saving...' : 'Save Changes'}
									</button>
								</div>
							</div>
						</section>
					)}

					{activeSection === 'preferences' && (
						<section className='border border-border rounded-lg bg-card overflow-hidden'>
							<div className='px-6 py-4 border-b border-border bg-card/50'>
								<h2 className='font-medium flex items-center gap-2'>
									<Settings size={18} />
									Preferences
								</h2>
							</div>

							<div className='p-6 space-y-4'>
								<div className='grid gap-2'>
									<label className='text-sm font-medium'>Timezone</label>
									<select
										value={timezone}
										onChange={(e) => setTimezone(e.target.value)}
										className='h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm'
									>
										{TIMEZONES.map((tz) => (
											<option key={tz} value={tz}>
												{tz}
											</option>
										))}
									</select>
								</div>

								<div className='grid gap-2'>
									<label className='text-sm font-medium'>Language</label>
									<select
										value={language}
										onChange={(e) => setLanguage(e.target.value)}
										className='h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm'
									>
										{LANGUAGES.map((lang) => (
											<option key={lang} value={lang}>
												{lang.toUpperCase()}
											</option>
										))}
									</select>
								</div>

								<div className='flex items-center gap-2'>
									<input
										type='checkbox'
										id='emailNotifications'
										checked={emailNotifications}
										onChange={(e) =>
											setEmailNotifications(e.target.checked)
										}
										className='w-4 h-4'
									/>
									<label htmlFor='emailNotifications' className='text-sm'>
										Receive email notifications
									</label>
								</div>

								<div className='pt-2'>
									<button
										onClick={handleSaveProfile}
										disabled={updateProfile.isPending}
										className='px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity50'
									>
										{updateProfile.isPending ? 'Saving...' : 'Save Changes'}
									</button>
								</div>
							</div>
						</section>
					)}

					{activeSection === 'security' && (
						<section className='border border-border rounded-lg bg-card overflow-hidden'>
							<div className='px-6 py-4 border-b border-border bg-card/50'>
								<h2 className='font-medium flex items-center gap-2'>
									<Lock size={18} />
									Security
								</h2>
							</div>

							<div className='p-6 space-y-4'>
								<div className='grid gap-2'>
									<label className='text-sm font-medium'>Current Password</label>
									<Input
										type='password'
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										placeholder='Enter current password'
									/>
								</div>

								<div className='grid gap-2'>
									<label className='text-sm font-medium'>New Password</label>
									<Input
										type='password'
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder='Enter new password'
									/>
								</div>

								<div className='grid gap-2'>
									<label className='text-sm font-medium'>Confirm New Password</label>
									<Input
										type='password'
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder='Confirm new password'
									/>
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
										className='px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity50'
									>
										{changePassword.isPending
											? 'Changing...'
											: 'Change Password'}
									</button>
								</div>
							</div>
						</section>
					)}

					{activeSection === 'whatsapp' && (
						<section className='border border-border rounded-lg bg-card overflow-hidden'>
							<div className='px-6 py-4 border-b border-border bg-card/50'>
								<h2 className='font-medium flex items-center gap-2'>
									<MessageCircle size={18} />
									WhatsApp Connection
								</h2>
							</div>

							<div className='p-6 space-y-4'>
								{statusQuery.isLoading ? (
									<div className='flex items-center justify-center h-32'>
										<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
									</div>
								) : statusQuery.data?.connected ? (
									<div className='space-y-4'>
										<div className='flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20'>
											<div className='w-3 h-3 bg-green-500 rounded-full' />
											<div>
												<p className='font-medium text-green-600'>Connected</p>
												<p className='text-sm text-muted-foreground'>
													{statusQuery.data.phoneNumber}
												</p>
											</div>
										</div>
										<button
											onClick={handleDisconnect}
											disabled={logoutMutation.isPending}
											className='px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium disabled:opacity-50'
										>
											{logoutMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
										</button>
									</div>
								) : (
									<div className='space-y-4'>
										<div className='flex flex-col items-center gap-4'>
											<div className='border-2 border-dashed border-border rounded-lg p-8 text-center'>
												{qrMutation.isPending || qrData ? (
													<>
														{qrData && (
															<>
																<p className='font-medium mb-2'>Scan with WhatsApp</p>
																<img src={qrData} alt='WhatsApp QR Code' className='mx-auto mb-4' style={{ width: 200, height: 200 }} />
																<p className='text-sm text-muted-foreground'>
																	QR refreshes automatically in {countdown}s
																</p>
															</>
														)}
														{qrMutation.isPending && !qrData && (
															<>
																<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4' />
																<p className='text-muted-foreground'>Generating QR code...</p>
															</>
														)}
													</>
												) : (
													<>
														<p className='text-muted-foreground mb-4'>Click to connect WhatsApp</p>
														<button
															onClick={() => {
																qrMutation.mutate(handleQR);
															}}
															className='px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium'
														>
															Connect WhatsApp
														</button>
													</>
												)}
											</div>
										</div>
									</div>
								)}
							</div>
						</section>
					)}

					{activeSection === 'account' && (
						<section className='border border-border rounded-lg bg-card overflow-hidden'>
							<div className='px-6 py-4 border-b border-border bg-card/50'>
								<h2 className='font-medium flex items-center gap-2'>
									<Mail size={18} />
									Account Information
								</h2>
							</div>

							<div className='p-6 space-y-4'>
								<div className='grid gap-2'>
									<label className='text-sm font-medium text-muted-foreground'>
										Role
									</label>
									<p className='text-foreground capitalize'>{user.role}</p>
								</div>

								<div className='grid gap-2'>
									<label className='text-sm font-medium text-muted-foreground'>
										Subscription Plan
									</label>
									<p className='text-foreground capitalize'>
										{user.subscriptionPlan || 'free'}
									</p>
								</div>

								<div className='grid gap-2'>
									<label className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
										<Calendar size={14} />
										Member Since
									</label>
									<p className='text-foreground'>
										{formatDate(user.createdAt)}
									</p>
								</div>

								{user.lastLogin && (
									<div className='grid gap-2'>
										<label className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
											<Calendar size={14} />
											Last Login
										</label>
										<p className='text-foreground'>
											{formatDate(user.lastLogin)}
										</p>
									</div>
								)}

								<div className='grid gap-2'>
									<label className='text-sm font-medium text-muted-foreground'>
										Login Count
									</label>
									<p className='text-foreground'>{user.loginCount || 0}</p>
								</div>
							</div>
						</section>
					)}
				</div>
			</div>
		</div>
	);
}