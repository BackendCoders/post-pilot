import React from 'react';
import { PlusCircle, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const Button = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & {
		variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
		size?: 'default' | 'sm' | 'icon';
	}
>(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
	const variants = {
		primary:
			'bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.98]',
		secondary: 'bg-muted text-foreground hover:bg-muted/80',
		outline:
			'border border-border bg-transparent hover:bg-muted/50 text-foreground',
		ghost: 'hover:bg-muted text-muted-foreground hover:text-foreground',
	};
	const sizes = {
		default: 'px-4 py-2 text-sm',
		sm: 'px-3 py-1.5 text-xs',
		icon: 'h-8 w-8 p-1.5',
	};
	return (
		<button
			ref={ref}
			className={cn(
				'inline-flex items-center justify-center rounded-lg font-medium transition-all disabled:opacity-50',
				variants[variant],
				sizes[size],
				className,
			)}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

function StatCard({
	title,
	value,
	desc,
}: {
	title: string;
	value: string;
	desc: string;
}) {
	return (
		<div className='p-5 rounded-xl border border-border bg-card shadow-sm'>
			<h3 className='text-sm font-medium text-muted-foreground'>{title}</h3>
			<div className='mt-2 flex items-baseline gap-2'>
				<span className='text-2xl font-semibold tracking-tight'>{value}</span>
			</div>
			<p className='text-xs text-muted-foreground mt-1'>{desc}</p>
		</div>
	);
}

export default function DashboardHome() {
	return (
		<div className='space-y-6'>
			<div className='flex items-end justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>
						System Overview
					</h1>
					<p className='text-sm text-muted-foreground mt-1'>
						Manage and automate your cross-platform strategies.
					</p>
				</div>
				<Button size='sm'>
					<PlusCircle
						size={16}
						className='mr-2'
					/>{' '}
					New Action
				</Button>
			</div>

			{/* DENSE DATA GRID */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<StatCard
					title='Active Workflows'
					value='12'
					desc='+2 this week'
				/>
				<StatCard
					title='Cumulative Reach'
					value='142.4k'
					desc='+14% vs last month'
				/>
				<StatCard
					title='Average Conversion'
					value='4.2%'
					desc='Above threshold'
				/>
			</div>

			{/* CONTENT SURFACE */}
			<div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden min-h-100'>
				<div className='p-1 flex items-center border-b border-border bg-muted/20'>
					<div className='flex text-sm font-medium'>
						<button className='px-4 py-2 text-foreground bg-background rounded-md shadow-sm border border-border/50'>
							Overview
						</button>
						<button className='px-4 py-2 text-muted-foreground hover:text-foreground'>
							Activity
						</button>
						<button className='px-4 py-2 text-muted-foreground hover:text-foreground'>
							Integrations
						</button>
					</div>
				</div>
				<div className='p-6'>
					<div className='rounded-lg border border-dashed border-border p-12 flex flex-col items-center justify-center text-center'>
						<div className='w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4'>
							<LayoutDashboard
								size={20}
								className='text-muted-foreground'
							/>
						</div>
						<h3 className='font-semibold mb-1'>Welcome to the Dashboard</h3>
						<p className='text-sm text-muted-foreground mb-4'>
							You have successfully configured the platform layout. Select a
							tool from the sidebar to continue.
						</p>
						<Button
							variant='outline'
							size='sm'
						>
							Explore Modules
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
