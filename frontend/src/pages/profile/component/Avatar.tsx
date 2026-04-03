import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useLogout } from '@/query/auth.query';

const ProfileIcon = () => {
	const { handleLogout } = useLogout();

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button className='rounded-full outline-none ring-offset-2 focus:ring-2 ring-ring transition-transform active:scale-95'>
					<Avatar className='h-9 w-9 border'>
						<AvatarImage
							src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png'
							alt='Hallie Richards'
						/>
						<AvatarFallback>HR</AvatarFallback>
					</Avatar>
				</button>
			</PopoverTrigger>

			{/* Google-style container */}
			<PopoverContent
				align='end'
				className='w-[340px] p-4 rounded-[28px] shadow-2xl'
			>
				<div className='flex flex-col items-center'>
					{/* Header with email */}
					<p className='text-sm font-medium mb-4'>
						hallie.richards@example.com
					</p>

					{/* Large central Avatar */}
					<div className='relative mb-3'>
						<Avatar className='h-20 w-20'>
							<AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' />
							<AvatarFallback className='text-2xl'>HR</AvatarFallback>
						</Avatar>
					</div>

					<h2 className='text-xl font-normal'>Hi, Hallie!</h2>

					{/* Manage Account Button (Google Style) */}
					<Button
						variant='outline'
						className='mt-4 rounded-full px-6 border-slate-300 font-medium'
					>
						Manage your Account
					</Button>

					{/* The Logout Section */}
					<div className='mt-6 w-full pt-4 border-t flex justify-center'>
						<Button
							onClick={handleLogout}
							variant='ghost'
							className='rounded-full px-6 py-6 hover:bg-slate-100 text-slate-600 flex items-center gap-2'
						>
							<LogOut className='h-4 w-4' />
							Sign out
						</Button>
					</div>

					{/* Footer Links */}
					<div className='mt-2 flex gap-2 text-[11px] text-muted-foreground'>
						<span className='hover:underline cursor-pointer'>
							Privacy Policy
						</span>
						<span>•</span>
						<span className='hover:underline cursor-pointer'>
							Terms of Service
						</span>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default ProfileIcon;
