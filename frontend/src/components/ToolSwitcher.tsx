import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutGrid, Rocket, Users, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

const tools = [
	{
		name: 'Post Pilot',
		description: 'Social Media Management',
		icon: Send,
		color: 'text-blue-500',
		bgColor: 'bg-blue-500/10',
		path: '/post-pilot',
	},
	{
		name: 'SEO Rocket',
		description: 'Search Engine Optimization',
		icon: Rocket,
		color: 'text-orange-500',
		bgColor: 'bg-orange-500/10',
		path: '/seo-rocket',
	},
	{
		name: 'Lead Generator',
		description: 'B2B Lead Generation',
		icon: Users,
		color: 'text-green-500',
		bgColor: 'bg-green-500/10',
		path: '/lead-generator',
	},
];

export function ToolSwitcher() {
	const navigate = useNavigate();
	const location = useLocation();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className='p-2 rounded-full hover:bg-accent/50 transition-colors text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center'>
					<LayoutGrid className='w-5 h-5' />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' className='w-[320px] p-2 rounded-2xl border border-border/50 shadow-xl'>
				<DropdownMenuLabel className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2 mt-1'>
					Company Tools
				</DropdownMenuLabel>
				<div className='grid grid-cols-1 gap-1'>
					{tools.map((tool) => {
						const isActive = location.pathname.startsWith(tool.path);
						return (
							<DropdownMenuItem
								key={tool.name}
								onClick={() => navigate(tool.path)}
								className={cn(
									'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all outline-none',
									isActive
										? 'bg-accent/50 focus:bg-accent/50'
										: 'hover:bg-accent/30 focus:bg-accent/30',
								)}
							>
							<div
								className={cn('p-2.5 rounded-xl shrink-0', tool.bgColor, tool.color)}
							>
								<tool.icon className='w-5 h-5' />
							</div>
							<div className='flex flex-col gap-0.5 justify-center mt-0.5'>
								<span className='text-sm font-semibold text-foreground'>{tool.name}</span>
								<span className='text-xs text-muted-foreground line-clamp-1'>
									{tool.description}
								</span>
							</div>
						</DropdownMenuItem>
						);
					})}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
