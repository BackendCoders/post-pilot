'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import WhatsAppConnectionPanel from '@/components/whatsapp/WhatsAppConnectionPanel';

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

const PROFILE_SECTIONS = [
	{ id: 'personal', label: 'Personal', icon: User },
	{ id: 'company', label: 'Company', icon: Building },
	{ id: 'web', label: 'Web Presence', icon: Globe },
	{ id: 'preferences', label: 'Preferences', icon: Settings },
	{ id: 'security', label: 'Security', icon: Lock },
	{ id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
	{ id: 'account', label: 'Account', icon: Mail },
] as const;

const PROFILE_SECTION_IDS = PROFILE_SECTIONS.map((section) => section.id);
const isProfileSectionId = (
	value: string | undefined,
): value is (typeof PROFILE_SECTIONS)[number]['id'] =>
	Boolean(value) &&
	PROFILE_SECTION_IDS.includes(
		value as (typeof PROFILE_SECTIONS)[number]['id'],
	);

export default function ProfilePage() {
	const { data: user, isLoading } = useAuth();
	const updateProfile = useUpdateProfile();
	const changePassword = useChangePassword();
	const navigate = useNavigate();
	const { section: sectionParam } = useParams<{ section?: string }>();

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
	const activeSection = isProfileSectionId(sectionParam)
		? sectionParam
		: 'personal';

	useEffect(() => {
		if (!isProfileSectionId(sectionParam)) {
			navigate('/dashboard/profile/personal', { replace: true });
		}
	}, [navigate, sectionParam]);

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
				<div className='animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent' />
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

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const Label = ({ children }: { children: React.ReactNode }) => (
		<label className='text-xs font-medium text-muted-foreground mb-1 block'>
			{children}
		</label>
	);

	const PrimaryButton = ({
		onClick,
		disabled,
		children,
		className = '',
	}: any) => (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium transition-all hover:shadow-sm active:scale-95 disabled:opacity-50 ${className}`}
		>
			{children}
		</button>
	);

	return (
		<div className='max-w-4xl mx-auto p-4 md:p-6 font-sans text-foreground'>
			<header className='mb-6'>
				<h1 className='text-xl font-bold tracking-tight'>Profile Settings</h1>
				<p className='text-sm text-muted-foreground'>
					Manage your identity and workspace preferences.
				</p>
			</header>

			<div className='flex flex-col md:flex-row gap-6'>
				{/* Sidebar Navigation */}
				<nav className='w-full md:w-48 shrink-0 space-y-0.5'>
					{PROFILE_SECTIONS.map((section) => {
						const Icon = section.icon;
						const isActive = activeSection === section.id;
						return (
							<button
								key={section.id}
								onClick={() => navigate(`/dashboard/profile/${section.id}`)}
								className={`
                                    flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-xl 
                                    transition-all duration-200 active:scale-95
                                    ${
																			isActive
																				? 'bg-card text-foreground border border-border shadow-sm'
																				: 'text-muted-foreground hover:bg-card/50 hover:text-foreground'
																		}
                                `}
							>
								<span className='flex items-center gap-2'>
									<Icon
										size={14}
										strokeWidth={isActive ? 2.5 : 2}
									/>
									{section.label}
								</span>
								{isActive && (
									<ChevronRight
										size={12}
										className='text-primary'
									/>
								)}
							</button>
						);
					})}
				</nav>

				{/* Main Content Area */}
				<main className='flex-1 min-w-0'>
					<div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
						<div className='px-5 py-3 border-b border-border bg-background/30'>
							<h2 className='text-xs font-bold uppercase tracking-widest text-muted-foreground/70'>
								{PROFILE_SECTIONS.find((s) => s.id === activeSection)?.label}{' '}
								Information
							</h2>
						</div>

						<div className='p-5'>
							{activeSection === 'personal' && (
								<div className='space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300'>
									<div className='grid gap-4 sm:grid-cols-2'>
										<div>
											<Label>Username</Label>
											<Input
												value={name}
												onChange={(e) => setName(e.target.value)}
												placeholder='johndoe'
												className='rounded-xl h-9 text-sm bg-background/50 focus:bg-background'
											/>
										</div>
										<div>
											<Label>Phone Number</Label>
											<Input
												type='tel'
												value={phoneNumber}
												onChange={(e) => setPhoneNumber(e.target.value)}
												placeholder='+1 (555) 000-0000'
												className='rounded-xl h-9 text-sm bg-background/50 focus:bg-background'
											/>
										</div>
									</div>
									<div>
										<Label>Email Address</Label>
										<Input
											type='email'
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder='john@example.com'
											className='rounded-xl h-9 text-sm bg-background/50 focus:bg-background'
										/>
									</div>
									<div className='pt-2'>
										<PrimaryButton
											onClick={handleSaveProfile}
											disabled={updateProfile.isPending}
										>
											{updateProfile.isPending ? 'Saving...' : 'Save Changes'}
										</PrimaryButton>
									</div>
								</div>
							)}

							{activeSection === 'company' && (
								<div className='space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300'>
									<div>
										<Label>Company Name</Label>
										<Input
											value={companyName}
											onChange={(e) => setCompanyName(e.target.value)}
											placeholder='Acme Corp'
											className='rounded-xl h-9 text-sm'
										/>
									</div>
									<div className='grid gap-4 sm:grid-cols-2'>
										<div>
											<Label>Company Size</Label>
											<select
												value={companySize}
												onChange={(e) => setCompanySize(e.target.value)}
												className='flex h-9 w-full rounded-xl border border-border bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-primary/30'
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
										<div>
											<Label>Job Title</Label>
											<Input
												value={jobTitle}
												onChange={(e) => setJobTitle(e.target.value)}
												placeholder='Product Designer'
												className='rounded-xl h-9 text-sm'
											/>
										</div>
									</div>
									<div className='pt-2'>
										<PrimaryButton
											onClick={handleSaveProfile}
											disabled={updateProfile.isPending}
										>
											Save Company Data
										</PrimaryButton>
									</div>
								</div>
							)}

							{activeSection === 'web' && (
								<div className='space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300'>
									<div>
										<Label>Website</Label>
										<Input
											value={website}
											onChange={(e) => setWebsite(e.target.value)}
											placeholder='https://company.com'
											className='rounded-xl h-9 text-sm'
										/>
									</div>
									<div>
										<Label>LinkedIn Profile</Label>
										<Input
											value={linkedinUrl}
											onChange={(e) => setLinkedinUrl(e.target.value)}
											placeholder='https://linkedin.com/in/user'
											className='rounded-xl h-9 text-sm'
										/>
									</div>
									<div className='pt-2'>
										<PrimaryButton onClick={handleSaveProfile}>
											Update Links
										</PrimaryButton>
									</div>
								</div>
							)}

							{activeSection === 'preferences' && (
								<div className='space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300'>
									<div className='grid gap-4 sm:grid-cols-2'>
										<div>
											<Label>Timezone</Label>
											<select
												value={timezone}
												onChange={(e) => setTimezone(e.target.value)}
												className='flex h-9 w-full rounded-xl border border-border bg-background px-3 py-1 text-sm outline-none'
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
										<div>
											<Label>Language</Label>
											<select
												value={language}
												onChange={(e) => setLanguage(e.target.value)}
												className='flex h-9 w-full rounded-xl border border-border bg-background px-3 py-1 text-sm outline-none'
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
									<label className='flex items-center gap-3 p-3 rounded-xl border border-border bg-background/20 hover:bg-background/40 transition-colors cursor-pointer'>
										<input
											type='checkbox'
											checked={emailNotifications}
											onChange={(e) => setEmailNotifications(e.target.checked)}
											className='w-4 h-4 rounded-md border-border text-primary focus:ring-primary'
										/>
										<span className='text-sm font-medium'>
											Enable email notifications
										</span>
									</label>
									<div className='pt-2'>
										<PrimaryButton onClick={handleSaveProfile}>
											Save Preferences
										</PrimaryButton>
									</div>
								</div>
							)}

							{activeSection === 'security' && (
								<div className='space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300'>
									<div>
										<Label>Current Password</Label>
										<Input
											type='password'
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
											className='rounded-xl h-9'
										/>
									</div>
									<div className='grid gap-4 sm:grid-cols-2'>
										<div>
											<Label>New Password</Label>
											<Input
												type='password'
												value={newPassword}
												onChange={(e) => setNewPassword(e.target.value)}
												className='rounded-xl h-9'
											/>
										</div>
										<div>
											<Label>Confirm Password</Label>
											<Input
												type='password'
												value={confirmPassword}
												onChange={(e) => setConfirmPassword(e.target.value)}
												className='rounded-xl h-9'
											/>
										</div>
									</div>
									<div className='pt-2'>
										<PrimaryButton
											onClick={handleChangePassword}
											disabled={
												changePassword.isPending ||
												!currentPassword ||
												!newPassword ||
												!confirmPassword
											}
										>
											{changePassword.isPending
												? 'Updating...'
												: 'Change Password'}
										</PrimaryButton>
									</div>
								</div>
							)}

							{activeSection === 'whatsapp' && (
								<div className='animate-in fade-in slide-in-from-bottom-1 duration-300'>
									<WhatsAppConnectionPanel autoStart />
								</div>
							)}

							{activeSection === 'account' && (
								<div className='grid gap-3 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-1 duration-300'>
									{[
										{ label: 'Access Level', value: user.role },
										{
											label: 'Active Plan',
											value: user.subscriptionPlan || 'Free',
											primary: true,
										},
										{
											label: 'Joined Date',
											value: formatDate(user.createdAt),
											icon: Calendar,
										},
										{
											label: 'Usage Stats',
											value: `${user.loginCount || 0} Sessions`,
										},
									].map((stat, i) => (
										<div
											key={i}
											className='p-3 bg-background/50 rounded-xl border border-border'
										>
											<p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 flex items-center gap-1'>
												{stat.icon && <stat.icon size={10} />} {stat.label}
											</p>
											<p
												className={`text-sm font-semibold ${stat.primary ? 'text-primary' : 'text-foreground'} capitalize`}
											>
												{stat.value}
											</p>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
