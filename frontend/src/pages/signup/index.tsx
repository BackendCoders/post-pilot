import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useSignUp } from '@/query/auth.query';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type SignUpFormData = {
	userName: string;
	email: string;
	password: string;
	confirmPassword: string;
};

const defaultFormData: SignUpFormData = {
	userName: '',
	email: '',
	password: '',
	confirmPassword: '',
};

const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export default function SignUpScreen() {
	const { mutate: signUp, isPending } = useSignUp();
	const { data } = useAuth();
	const navigate = useNavigate();
	const [formData, setFormData] = useState(defaultFormData);
	const [errors, setErrors] = useState<
		Partial<Record<keyof SignUpFormData, string>>
	>({});

	useEffect(() => {
		if (data) navigate('/');
	}, [data, navigate]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: undefined }));
	};

	const validateForm = () => {
		const nextErrors: Partial<Record<keyof SignUpFormData, string>> = {};

		if (!formData.userName.trim()) {
			nextErrors.userName = 'Username is required';
		} else if (formData.userName.trim().length > 50) {
			nextErrors.userName = 'Username cannot exceed 50 characters';
		}

		if (!formData.email.trim()) {
			nextErrors.email = 'Email is required';
		} else if (!emailPattern.test(formData.email.trim())) {
			nextErrors.email = 'Please enter a valid email';
		}

		if (!formData.password) {
			nextErrors.password = 'Password is required';
		} else if (formData.password.length < 8) {
			nextErrors.password = 'Password must be at least 8 characters long';
		}

		if (!formData.confirmPassword) {
			nextErrors.confirmPassword = 'Please confirm your password';
		} else if (formData.confirmPassword !== formData.password) {
			nextErrors.confirmPassword = 'Passwords do not match';
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!validateForm()) return;

		signUp({
			userName: formData.userName.trim(),
			email: formData.email.trim().toLowerCase(),
			password: formData.password,
		});
	};

	return (
		<main className='min-h-screen bg-background px-4 py-12'>
			<div className='mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm'>
				<section className='hidden w-1/2 flex-col justify-between bg-zinc-950 px-10 py-12 text-white lg:flex'>
					<div>
						<div className='mb-6 inline-flex rounded-2xl bg-white/10 p-3'>
							<svg
								className='h-8 w-8'
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
						<p className='mb-3 text-sm uppercase tracking-[0.35em] text-white/60'>
							Post Pilot
						</p>
						<h1 className='text-4xl font-semibold leading-tight'>
							Create your workspace and start publishing faster.
						</h1>
						<p className='mt-4 max-w-md text-sm leading-6 text-white/70'>
							Your account is created with the backend user schema fields only:
							username, email, and password.
						</p>
					</div>

					<div className='grid gap-4'>
						<div className='rounded-2xl border border-white/10 bg-white/5 p-5'>
							<p className='text-sm text-white/70'>Schema-aligned signup</p>
							<p className='mt-2 text-xl font-medium'>
								userName, email, password
							</p>
						</div>
					</div>
				</section>

				<section className='flex w-full items-center justify-center px-6 py-10 lg:w-1/2 lg:px-10'>
					<div className='w-full max-w-md space-y-8'>
						<div className='space-y-2 text-center lg:text-left'>
							<h2 className='text-3xl font-semibold tracking-tight text-foreground'>
								Create account
							</h2>
							<p className='text-sm text-muted-foreground'>
								Use your email and a minimum 8 character password.
							</p>
						</div>

						<form
							onSubmit={handleSubmit}
							className='space-y-5'
						>
							<div className='space-y-2'>
								<Label htmlFor='userName'>Username</Label>
								<Input
									id='userName'
									name='userName'
									type='text'
									placeholder='Your display name'
									value={formData.userName}
									onChange={handleInputChange}
									required
									maxLength={50}
									className='h-11 rounded-xl'
								/>
								{errors.userName ? (
									<p className='text-sm text-destructive'>{errors.userName}</p>
								) : null}
							</div>

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
									className='h-11 rounded-xl'
								/>
								{errors.email ? (
									<p className='text-sm text-destructive'>{errors.email}</p>
								) : null}
							</div>

							<div className='space-y-2'>
								<Label htmlFor='password'>Password</Label>
								<Input
									id='password'
									name='password'
									type='password'
									placeholder='At least 8 characters'
									value={formData.password}
									onChange={handleInputChange}
									required
									minLength={8}
									className='h-11 rounded-xl'
								/>
								{errors.password ? (
									<p className='text-sm text-destructive'>{errors.password}</p>
								) : null}
							</div>

							<div className='space-y-2'>
								<Label htmlFor='confirmPassword'>Confirm password</Label>
								<Input
									id='confirmPassword'
									name='confirmPassword'
									type='password'
									placeholder='Repeat your password'
									value={formData.confirmPassword}
									onChange={handleInputChange}
									required
									className='h-11 rounded-xl'
								/>
								{errors.confirmPassword ? (
									<p className='text-sm text-destructive'>
										{errors.confirmPassword}
									</p>
								) : null}
							</div>

							<Button
								type='submit'
								disabled={isPending}
								className='h-11 w-full rounded-xl'
							>
								{isPending ? 'Creating account...' : 'Create account'}
							</Button>
						</form>

						<p className='text-center text-sm text-muted-foreground lg:text-left'>
							Already have an account?
							<Link
								to='/login'
								className='font-semibold text-primary hover:underline'
							>
								Sign in
							</Link>
						</p>
					</div>
				</section>
			</div>
		</main>
	);
}
