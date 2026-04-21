import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming standard Shadcn Input
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useGoogleSignIn, useSignIn } from '@/query/auth.query';
import { Link, useNavigate } from 'react-router-dom';
import { requestGoogleAccessToken } from '@/utils/googleOAuth';
import { toast } from 'sonner';

const userData = {
	email: '',
	password: '',
	remember: false,
};

export default function LoginScreen() {
	const { mutate: login, isPending } = useSignIn();
	const { mutateAsync: googleSignIn, isPending: isGooglePending } =
		useGoogleSignIn();
	const { data } = useAuth();
	const [formData, setFormData] = useState(userData);
	const navigation = useNavigate();

	useEffect(() => {
		if (data) navigation('/');
	}, [data, navigation]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		login({
			email: formData.email.trim().toLowerCase(),
			password: formData.password,
		});
	};

	const handleGoogleSignIn = async () => {
		try {
			const accessToken = await requestGoogleAccessToken();
			await googleSignIn({ accessToken });
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Google sign in failed';
			toast.error(message);
		}
	};

	return (
		<main className='min-h-screen flex items-center justify-center bg-background px-4 py-12'>
			<div className='w-full max-w-100 space-y-8'>
				{/* Brand Logo & Header */}
				<div className='flex flex-col items-center text-center'>
					<div className='bg-primary/10 p-3 rounded-2xl mb-4'>
						<svg
							className='w-8 h-8 text-primary'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
							/>
						</svg>
					</div>
					<h1 className='text-2xl font-semibold tracking-tight text-foreground'>
						Welcome back
					</h1>
					<p className='text-sm text-muted-foreground mt-2'>
						Please enter your details to sign in
					</p>
				</div>

				{/* Login Card */}
				<div className='bg-card border border-border/40 shadow-sm rounded-3xl p-8'>
					<form
						onSubmit={handleLogin}
						className='space-y-5'
					>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email address</Label>
							<Input
								id='email'
								name='email'
								type='email'
								placeholder='name@company.com'
								value={formData.email}
								onChange={handleInputChange}
								required
								className='h-11 rounded-xl bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all'
							/>
						</div>

						<div className='space-y-2'>
							<div className='flex justify-between items-center'>
								<Label htmlFor='password'>Password</Label>
								<a
									href='#'
									className='text-xs font-medium text-primary hover:text-primary/80'
								>
									Forgot password?
								</a>
							</div>
							<Input
								id='password'
								name='password'
								type='password'
								placeholder='••••••••'
								value={formData.password}
								onChange={handleInputChange}
								required
								className='h-11 rounded-xl bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all'
							/>
						</div>

						<div className='flex items-center space-x-2'>
							<Checkbox
								id='remember'
								checked={formData.remember}
								onCheckedChange={(checked) =>
									setFormData((p) => ({ ...p, remember: !!checked }))
								}
							/>
							<label
								htmlFor='remember'
								className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
							>
								Remember for 30 days
							</label>
						</div>

						<Button
							type='submit'
							disabled={isPending}
							className='w-full h-11 rounded-xl font-medium text-sm transition-transform active:scale-[0.98]'
						>
							{isPending ? 'Signing in...' : 'Sign in'}
						</Button>
					</form>

					<div className='relative my-8'>
						<div className='absolute inset-0 flex items-center'>
							<span className='w-full border-t border-border' />
						</div>
						<div className='relative flex justify-center text-xs uppercase'>
							<span className='bg-card px-2 text-muted-foreground'>
								Or continue with
							</span>
						</div>
					</div>

					<Button
						variant='outline'
						className='w-full h-11 rounded-xl border-border flex items-center gap-2'
						type='button'
						onClick={handleGoogleSignIn}
						disabled={isGooglePending}
					>
						<svg
							className='w-4 h-4'
							viewBox='0 0 24 24'
						>
							<path
								fill='currentColor'
								d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
							/>
							<path
								fill='currentColor'
								d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
							/>
							<path
								fill='currentColor'
								d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z'
							/>
							<path
								fill='currentColor'
								d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
							/>
						</svg>
						{isGooglePending ? 'Connecting Google...' : 'Google'}
					</Button>
				</div>

				<p className='text-center text-sm text-muted-foreground'>
					Don't have an account?{' '}
					<Link
						to='/signup'
						className='inline-block relative z-10 cursor-pointer font-semibold text-primary hover:underline underline-offset-4'
					>
						Sign up for free
					</Link>
				</p>
			</div>
		</main>
	);
}
