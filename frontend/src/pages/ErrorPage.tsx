import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';

export default function RouteErrorPage() {
	const error = useRouteError();
	const navigate = useNavigate();

	let title = 'Something went wrong';
	let description =
		'An unexpected error occurred. Don\'t worry, your data is safe.';
	let statusCode: number | null = null;
	let errorMessage = '';

	if (isRouteErrorResponse(error)) {
		statusCode = error.status;
		if (error.status === 404) {
			title = 'Page not found';
			description =
				"The page you're looking for doesn't exist or has been moved.";
		} else if (error.status === 403) {
			title = 'Access denied';
			description = "You don't have permission to access this page.";
		} else if (error.status === 500) {
			title = 'Server error';
			description = 'Something went wrong on our end. Please try again later.';
		}
		errorMessage = error.statusText || error.data?.message || '';
	} else if (error instanceof Error) {
		errorMessage = error.message;
	}

	return (
		<div className='flex items-center justify-center min-h-screen bg-background p-6'>
			<div className='max-w-md w-full text-center space-y-6'>
				{/* Status Code */}
				{statusCode && (
					<div className='text-7xl font-black text-primary/15 tracking-tighter select-none'>
						{statusCode}
					</div>
				)}

				{/* Icon */}
				{!statusCode && (
					<div className='mx-auto w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='1.5'
							strokeLinecap='round'
							strokeLinejoin='round'
							className='w-10 h-10 text-red-500'
						>
							<circle cx='12' cy='12' r='10' />
							<line x1='12' y1='8' x2='12' y2='12' />
							<line x1='12' y1='16' x2='12.01' y2='16' />
						</svg>
					</div>
				)}

				{/* Title */}
				<div>
					<h1 className='text-2xl font-bold tracking-tight text-foreground'>
						{title}
					</h1>
					<p className='mt-2 text-sm text-muted-foreground leading-relaxed'>
						{description}
					</p>
				</div>

				{/* Error details */}
				{errorMessage && (
					<details className='text-left rounded-xl border border-border bg-muted/30 p-4'>
						<summary className='text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors'>
							Technical details
						</summary>
						<pre className='mt-3 text-[11px] text-red-500/80 whitespace-pre-wrap break-all font-mono leading-relaxed max-h-32 overflow-auto'>
							{errorMessage}
						</pre>
					</details>
				)}

				{/* Actions */}
				<div className='flex items-center justify-center gap-3'>
					<button
						onClick={() => navigate(-1)}
						className='px-5 py-2.5 text-sm font-medium rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200'
					>
						Go Back
					</button>
					<button
						onClick={() => navigate('/dashboard')}
						className='px-5 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200'
					>
						Go to Dashboard
					</button>
				</div>

				{/* Retry */}
				<button
					onClick={() => window.location.reload()}
					className='text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4'
				>
					Try refreshing the page
				</button>
			</div>
		</div>
	);
}
