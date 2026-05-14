'use client';

import NavBar from '@/components/navbar';
import Footer from '@/components/footer';
import {
	Rocket,
	Box,
	Search,
	ArrowRight,
	Sparkles,
	Zap,
	ShieldCheck,
	Globe,
	Layout,
	Cpu,
	Database,
	BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * HomePage Refactor
 * Focus: Professional SaaS aesthetic, compact spacing, and refined hierarchy.
 */
const HomePage = () => {
	const navigate = useNavigate();
	const tools = [
		{
			title: 'Post Pilot',
			description:
				'Automate your social presence with Gemini-powered content scheduling and trend analysis.',
			icon: <Box className='w-4 h-4' />,
			link: '/post-pilot',
			tag: 'Social',
		},
		{
			title: 'SEO Rocket',
			description:
				'Propel your site to the top of search results using autonomous keyword optimization.',
			icon: <Rocket className='w-4 h-4' />,
			link: '/seo-rocket',
			tag: 'Growth',
		},
		{
			title: 'Lead Generator',
			description:
				'Intelligently map B2B opportunities by extracting high-intent data from global maps.',
			icon: <Search className='w-4 h-4' />,
			link: '/lead-generator',
			tag: 'Sales',
		},
	];

	const features = [
		{
			title: 'AI Strategy Engine',
			description:
				'Real-time analysis of global market trends to pivot your strategy instantly.',
			icon: <Cpu className='w-4 h-4' />,
			className:
				'md:col-span-2 md:row-span-2 bg-primary/[0.03] border-primary/10',
		},
		{
			title: 'Automated Workflows',
			description: 'Set it and forget it. Our agents handle the execution.',
			icon: <Layout className='w-4 h-4' />,
			className: 'md:col-span-1 md:row-span-1',
		},
		{
			title: 'Data Intelligence',
			description: 'Extract deep insights from millions of data points.',
			icon: <Database className='w-4 h-4' />,
			className: 'md:col-span-1 md:row-span-1',
		},
		{
			title: 'Advanced Analytics',
			description: 'Track every metric that matters to your growth.',
			icon: <BarChart3 className='w-4 h-4' />,
			className: 'md:col-span-2 md:row-span-1',
		},
	];

	const steps = [
		{
			title: 'Connect',
			description: 'Integrate your existing accounts and data sources.',
		},
		{
			title: 'Analyze',
			description: 'Our AI scans for growth opportunities and trends.',
		},
		{
			title: 'Execute',
			description: 'Automated agents deploy optimized strategies.',
		},
	];

	const testimonials = [
		{
			quote:
				'PostPilot has completely redefined how we handle our digital presence. The AI insights are scary accurate.',
			author: 'Alex Rivera',
			role: 'Founder at TechFlow',
		},
		{
			quote:
				'The Lead Generator tool alone paid for the entire suite within the first week. Highly recommended.',
			author: 'Jordan Smith',
			role: 'Sales Director at GrowthScale',
		},
	];

	return (
		<div className='min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/10'>
			<NavBar />

			<main className='relative max-w-6xl mx-auto px-6 pt-24 pb-20 overflow-hidden'>
				{/* Ambient background accent */}
				<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary/10 blur-[120px] pointer-events-none opacity-50' />

				{/* Hero Section */}
				<header className='relative flex flex-col items-center text-center mb-24 space-y-6'>
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs font-medium'
					>
						<Sparkles className='w-3.5 h-3.5 text-primary' />
						<span>Introducing AI-powered automation v2.0</span>
					</motion.div>

					<h1 className='text-4xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1] max-w-4xl'>
						Your workspace, <span className='text-primary/90'>reimagined.</span>
					</h1>

					<p className='text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-normal'>
						A suite of intelligent tools designed to scale your business. Choose
						a module to begin your journey.
					</p>

					<div className='flex flex-wrap justify-center gap-3 pt-4'>
						<button
							onClick={() => navigate('/signup')}
							className='px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all hover:shadow-md hover:shadow-primary/20 active:scale-95'
						>
							Get Started for Free
						</button>
						<button
							onClick={() => navigate('/demo')}
							className='px-6 py-2.5 rounded-xl bg-card border border-border text-sm font-semibold transition-all hover:bg-muted active:scale-95'
						>
							Watch Demo
						</button>
					</div>
				</header>

				{/* Logos Section */}
				<div className='w-full mb-32 text-center'>
					<p className='text-[10px] font-bold uppercase tracking-[0.2em] mb-8 text-muted-foreground/60'>
						Trusted by innovative teams worldwide
					</p>
					<div className='flex flex-wrap justify-center gap-x-12 gap-y-6 items-center opacity-40 grayscale transition-all hover:grayscale-0 hover:opacity-100'>
						{['Stripe', 'Vercel', 'Linear', 'OpenAI', 'Mercury', 'Retool'].map(
							(name) => (
								<span
									key={name}
									className='text-lg font-black tracking-tighter'
								>
									{name}
								</span>
							),
						)}
					</div>
				</div>

				{/* Tools Grid */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-5 mb-32'>
					{tools.map((tool, idx) => (
						<a
							key={idx}
							href={tool.link}
							className='group relative flex flex-col p-6 bg-card border border-border rounded-xl transition-all duration-200 hover:border-primary/30 hover:shadow-sm active:scale-[0.98]'
						>
							<div className='mb-4 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white'>
								{tool.icon}
							</div>

							<div className='flex-grow space-y-2'>
								<div className='flex items-center justify-between'>
									<h3 className='font-bold tracking-tight text-base'>
										{tool.title}
									</h3>
									<span className='text-[9px] px-1.5 py-0.5 rounded-md bg-muted font-bold uppercase tracking-wider text-muted-foreground'>
										{tool.tag}
									</span>
								</div>
								<p className='text-sm text-muted-foreground leading-snug'>
									{tool.description}
								</p>
							</div>

							<div className='mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all'>
								Get started <ArrowRight className='w-3.5 h-3.5' />
							</div>
						</a>
					))}
				</div>

				{/* How it Works */}
				<section className='mb-32 space-y-12'>
					<div className='text-center space-y-2'>
						<h2 className='text-2xl md:text-4xl font-bold tracking-tight'>
							How it works
						</h2>
						<p className='text-muted-foreground text-sm max-w-md mx-auto'>
							Three simple steps to automate your entire operation.
						</p>
					</div>
					<div className='grid md:grid-cols-3 gap-8 relative'>
						<div className='hidden md:block absolute top-10 left-0 w-full h-px bg-border -z-10' />
						{steps.map((step, idx) => (
							<div
								key={idx}
								className='flex flex-col items-center text-center space-y-4'
							>
								<div className='w-20 h-20 rounded-full bg-background border border-border flex items-center justify-center text-xl font-black text-primary shadow-sm'>
									0{idx + 1}
								</div>
								<div className='space-y-1'>
									<h4 className='font-bold text-lg'>{step.title}</h4>
									<p className='text-sm text-muted-foreground max-w-[200px]'>
										{step.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</section>

				{/* Bento Grid */}
				<section className='mb-32 space-y-12'>
					<div className='text-center space-y-2'>
						<h2 className='text-2xl md:text-4xl font-bold tracking-tight'>
							Built for scale
						</h2>
						<p className='text-muted-foreground text-sm'>
							Enterprise-grade capabilities for teams of all sizes.
						</p>
					</div>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-3 auto-rows-[160px]'>
						{features.map((feature, idx) => (
							<div
								key={idx}
								className={`bg-card border border-border rounded-xl p-6 flex flex-col justify-end transition-all hover:border-primary/20 ${feature.className}`}
							>
								<div className='mb-3 w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary'>
									{feature.icon}
								</div>
								<div>
									<h4 className='text-base font-bold tracking-tight'>
										{feature.title}
									</h4>
									<p className='text-xs text-muted-foreground leading-normal'>
										{feature.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</section>

				{/* Testimonials */}
				<section className='mb-32 grid md:grid-cols-2 gap-6'>
					{testimonials.map((t, idx) => (
						<div
							key={idx}
							className='bg-card border border-border rounded-xl p-8 space-y-6 transition-all hover:shadow-sm'
						>
							<div className='flex gap-0.5 text-primary'>
								{[...Array(5)].map((_, i) => (
									<Sparkles
										key={i}
										className='w-3 h-3 fill-primary'
									/>
								))}
							</div>
							<p className='text-lg font-medium leading-relaxed italic text-foreground/90'>
								"{t.quote}"
							</p>
							<div className='flex items-center gap-3'>
								<div className='w-10 h-10 rounded-full bg-muted border border-border shrink-0' />
								<div>
									<p className='text-sm font-bold'>{t.author}</p>
									<p className='text-xs text-muted-foreground'>{t.role}</p>
								</div>
							</div>
						</div>
					))}
				</section>

				{/* Trust Indicators */}
				<div className='py-8 border-t border-border flex flex-wrap justify-center gap-x-12 gap-y-6 grayscale opacity-60'>
					{[
						{ icon: ShieldCheck, label: 'Enterprise Security' },
						{ icon: Zap, label: 'Instant Activation' },
						{ icon: Globe, label: 'Global Infrastructure' },
					].map((item, i) => (
						<div
							key={i}
							className='flex items-center gap-2 text-xs font-semibold'
						>
							<item.icon className='w-4 h-4' /> {item.label}
						</div>
					))}
				</div>

				{/* CTA Section */}
				<section className='mt-32'>
					<div className='bg-primary rounded-3xl p-10 md:p-20 text-center space-y-6 relative overflow-hidden'>
						<div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]' />
						<h2 className='text-3xl md:text-5xl font-bold text-primary-foreground tracking-tight leading-tight'>
							Scale your business <br className='hidden md:block' /> with AI
							today.
						</h2>
						<p className='text-primary-foreground/80 text-sm md:text-base max-w-md mx-auto leading-normal'>
							Join over 50,000+ companies using PostPilot to automate their
							growth. No credit card required.
						</p>
						<div className='flex flex-wrap justify-center gap-3 pt-4'>
							<button
								onClick={() => navigate('/signup')}
								className='px-8 py-3 rounded-xl bg-white text-primary text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/10'
							>
								Start Free Trial
							</button>
							<button
								onClick={() => navigate('/demo')}
								className='px-8 py-3 rounded-xl bg-primary-foreground/10 border border-white/20 text-white text-sm font-bold transition-all hover:bg-white/10 active:scale-95'
							>
								Schedule Demo
							</button>
						</div>
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
};

export default HomePage;
