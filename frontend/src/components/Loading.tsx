const Loader = () => {
	return (
		<div className='fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background'>
			<div className='relative h-16 w-16'>
				<svg
					className='google-circle-svg h-full w-full'
					viewBox='25 25 50 50'
				>
					<circle
						className='google-circle-path'
						cx='50'
						cy='50'
						r='20'
						fill='none'
						strokeWidth='4'
						strokeMiterlimit='10'
					/>
				</svg>
			</div>

			{/* Subtle branding below */}
			<p className='mt-8 text-sm font-medium tracking-widest text-muted-foreground animate-pulse'>
				LOADING
			</p>

			<style>{`
				.google-circle-svg {
					animation: rotate 2s linear infinite;
					transform-origin: center center;
				}

				.google-circle-path {
					stroke-dasharray: 1, 200;
					stroke-dashoffset: 0;
					stroke-linecap: round;
					animation:
						dash 1.5s ease-in-out infinite,
						color 6s ease-in-out infinite;
				}

				@keyframes rotate {
					100% {
						transform: rotate(360deg);
					}
				}

				@keyframes dash {
					0% {
						stroke-dasharray: 1, 200;
						stroke-dashoffset: 0;
					}
					50% {
						stroke-dasharray: 89, 200;
						stroke-dashoffset: -35px;
					}
					100% {
						stroke-dasharray: 89, 200;
						stroke-dashoffset: -124px;
					}
				}

				@keyframes color {
					100%,
					0% {
						stroke: #4285f4;
					} /* Blue */
					25% {
						stroke: #ea4335;
					} /* Red */
					50% {
						stroke: #fbbc05;
					} /* Yellow */
					75% {
						stroke: #34a853;
					} /* Green */
				}
			`}</style>
		</div>
	);
};

export default Loader;
