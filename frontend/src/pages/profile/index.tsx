
import SocialCard from './component/SocialCard';
import {
	Instagram,
	Facebook,
	Music,
	Linkedin,
	ExternalLink,
} from 'lucide-react';

import { useGetSocials, useUpdateSocial } from '@/query/socials.query';
import { toast } from 'sonner';
function Page() {
	const { data: social } = useGetSocials();
	const { mutate: updateSocial } = useUpdateSocial();

	if (!social) return null;
	const SOCIAL_PLATFORMS = [
		{
			id: 'instagram',
			name: 'Instagram',
			api_label: 'insta_auth_token',
			description: 'Manage photo and reel synchronization',
			icon: (
				<Instagram
					size={20}
					className='text-[#E1306C]'
				/>
			),
			authToken: social['insta_auth_token'],
		},
		{
			id: 'facebook',
			name: 'Facebook',
			api_label: 'meta_auth_token',
			description: 'Connect with pages and community groups',
			icon: (
				<Facebook
					size={20}
					className='text-[#1877F2]'
				/>
			),
			authToken: social['meta_auth_token'],
		},
		{
			id: 'tiktok',
			name: 'TikTok',
			description: 'Sync trending short-form video content',
			api_label: 'tiktok_auth_token',
			icon: (
				<Music
					size={20}
					className='text-foreground'
				/>
			),
			authToken: social['tiktok_auth_token'],
		},
		{
			id: 'linkedin',
			name: 'LinkedIn',
			description: 'Professional networking and career updates',
			api_label: 'linkedin_auth_token',
			icon: (
				<Linkedin
					size={20}
					className='text-[#0A66C2]'
				/>
			),
			authToken: social['linkedin_auth_token'],
		},
	];

	const connectSocial = function (api_label: string, token: string) {
		if (!social) return toast.error('No social account Linked VIA user');
		updateSocial({ id: social._id, body: { [api_label]: token } });
	};

	return (
		<div className='min-h-screen bg-background text-foreground antialiased selection:bg-primary/20'>

			<main className='max-w-[840px] mx-auto px-4 sm:px-6 py-8 sm:py-12'>
				<header className='mb-10'>
					<h1 className='text-2xl sm:text-3xl font-normal tracking-tight mb-4'>
						Social Integrations
					</h1>
					<p className='text-sm sm:text-base leading-relaxed text-muted-foreground max-w-2xl'>
						Manage the third-party services connected to your account. These
						integrations allow you to automate content distribution and unified
						analytics.
						<a
							href='#'
							className='text-primary hover:underline ml-1 font-medium'
						>
							Learn more
						</a>
					</p>
				</header>

				{/* The Material Card Section */}
				<section className='border border-border rounded-lg bg-card overflow-hidden shadow-sm'>
					<div className='px-6 py-5 border-b border-border bg-card'>
						<h2 className='text-base font-medium'>Connected Services</h2>
					</div>

					<div className='divide-y divide-border'>
						{SOCIAL_PLATFORMS.map((platform) => (
							<SocialCard
								key={platform.id}
								Icon={platform.icon}
								social={platform.name}
								description={platform.description}
								onConnect={connectSocial}
								authToken={platform.authToken}
								apiLabel={platform.api_label}
							/>
						))}
					</div>

					<button className='w-full px-6 py-4 bg-muted/30 hover:bg-muted text-left transition-colors group'>
						<span className='text-sm font-medium text-primary flex items-center gap-2'>
							Add new service
						</span>
					</button>
				</section>

				<footer className='mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 px-2 text-xs text-muted-foreground'>
					<div className='flex items-center gap-2'>
						<ExternalLink size={14} />
						<span>Privacy Policy</span>
					</div>
					<span className='hidden sm:block text-border'>•</span>
					<span>Terms of Service</span>
				</footer>
			</main>
		</div>
	);
}


export default Page;
