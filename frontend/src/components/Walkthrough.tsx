import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import './walkthrough.css';

export interface WalkthroughStep {
	/** CSS selector for the target element, e.g. '[data-walkthrough="url-input"]' */
	target?: string;
	/** Tooltip title */
	title: string;
	/** Tooltip description */
	content: string;
	/** Preferred tooltip placement relative to the target */
	placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface WalkthroughProps {
	/** Step definitions */
	steps: WalkthroughStep[];
	/** Whether the walkthrough is currently visible */
	isVisible: boolean;
	/** Called when user finishes or skips the walkthrough */
	onComplete: () => void;
}

const PADDING = 8;
const TOOLTIP_GAP = 12;

export default function Walkthrough({
	steps,
	isVisible: externalIsVisible,
	onComplete,
}: WalkthroughProps) {
	const [activeStep, setActiveStep] = useState(0);
	const [isVisible, setIsVisible] = useState(false);
	const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
	const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({
		top: 0,
		left: 0,
	});
	const rafRef = useRef<number>(0);
	const dismissedRef = useRef(false);


	// Position calculator
	const positionElements = useCallback(() => {
		if (!isVisible || activeStep >= steps.length) return;

		const step = steps[activeStep];
		if (!step.target) {
			setSpotlightRect(null);
			setTooltipPos({
				top: window.innerHeight / 2 - 100,
				left: window.innerWidth / 2 - 170,
			});
			return;
		}

		const el = document.querySelector(step.target) as HTMLElement | null;
		if (!el) {
			setSpotlightRect(null);
			setTooltipPos({
				top: window.innerHeight / 2 - 100,
				left: window.innerWidth / 2 - 170,
			});
			return;
		}

		const rect = el.getBoundingClientRect();
		setSpotlightRect(rect);

		// Scroll element into view if needed
		const isInView =
			rect.top >= 0 &&
			rect.bottom <= window.innerHeight &&
			rect.left >= 0 &&
			rect.right <= window.innerWidth;

		if (!isInView) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			// Re-calculate after scroll
			requestAnimationFrame(() => {
				const newRect = el.getBoundingClientRect();
				setSpotlightRect(newRect);
				calculateTooltipPosition(newRect, step.placement);
			});
			return;
		}

		calculateTooltipPosition(rect, step.placement);
	}, [isVisible, activeStep, steps]);

	const calculateTooltipPosition = (
		rect: DOMRect,
		placement: WalkthroughStep['placement'] = 'bottom',
	) => {
		const tooltipW = 340;
		const tooltipH = 200; // estimated
		let top = 0;
		let left = 0;

		switch (placement) {
			case 'top':
				top = rect.top - PADDING - TOOLTIP_GAP - tooltipH;
				left = rect.left + rect.width / 2 - tooltipW / 2;
				break;
			case 'left':
				top = rect.top + rect.height / 2 - tooltipH / 2;
				left = rect.left - PADDING - TOOLTIP_GAP - tooltipW;
				break;
			case 'right':
				top = rect.top + rect.height / 2 - tooltipH / 2;
				left = rect.right + PADDING + TOOLTIP_GAP;
				break;
			case 'bottom':
			default:
				top = rect.bottom + PADDING + TOOLTIP_GAP;
				left = rect.left + rect.width / 2 - tooltipW / 2;
				break;
		}

		// Clamp to viewport
		left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));
		top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 16));

		// If tooltip goes below viewport, flip to top
		if (placement === 'bottom' && top + tooltipH > window.innerHeight - 16) {
			top = rect.top - PADDING - TOOLTIP_GAP - tooltipH;
			top = Math.max(16, top);
		}

		setTooltipPos({ top, left });
	};

	// Start walkthrough after a short delay
	useEffect(() => {
		if (!externalIsVisible || dismissedRef.current) {
			setIsVisible(false);
			return;
		}

		const timer = setTimeout(() => {
			setIsVisible(true);
		}, 800);

		return () => clearTimeout(timer);
	}, [externalIsVisible]);

	// Re-position on step change, resize, scroll
	useEffect(() => {
		if (!isVisible) return;

		positionElements();

		const handleUpdate = () => {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(positionElements);
		};

		window.addEventListener('resize', handleUpdate);
		window.addEventListener('scroll', handleUpdate, true);

		return () => {
			window.removeEventListener('resize', handleUpdate);
			window.removeEventListener('scroll', handleUpdate, true);
			cancelAnimationFrame(rafRef.current);
		};
	}, [isVisible, positionElements]);

	const handleNext = () => {
		if (activeStep < steps.length - 1) {
			setActiveStep((s) => s + 1);
		} else {
			handleFinish();
		}
	};

	const handleSkip = () => {
		handleFinish();
	};

	const handleFinish = () => {
		dismissedRef.current = true;
		setIsVisible(false);
		onComplete();
	};

	if (!isVisible) return null;

	const currentStep = steps[activeStep];
	const isLastStep = activeStep === steps.length - 1;

	return createPortal(
		<>
			{/* Backdrop */}
			<div className='walkthrough-backdrop' onClick={handleSkip} />

			{/* Spotlight */}
			{spotlightRect && (
				<div
					className='walkthrough-spotlight'
					style={{
						top: spotlightRect.top - PADDING,
						left: spotlightRect.left - PADDING,
						width: spotlightRect.width + PADDING * 2,
						height: spotlightRect.height + PADDING * 2,
					}}
				/>
			)}

			{/* Tooltip */}
			<div
				className='walkthrough-tooltip'
				key={activeStep}
				style={{
					top: tooltipPos.top,
					left: tooltipPos.left,
				}}
			>
				<div className='walkthrough-tooltip-accent' />
				<div className='walkthrough-tooltip-body'>
					<div className='walkthrough-tooltip-step'>
						Step {activeStep + 1} of {steps.length}
					</div>
					<div className='walkthrough-tooltip-title'>
						{currentStep.title}
					</div>
					<p className='walkthrough-tooltip-description'>
						{currentStep.content}
					</p>
				</div>
				<div className='walkthrough-tooltip-footer'>
					<div className='walkthrough-dots'>
						{steps.map((_, i) => (
							<div
								key={i}
								className={`walkthrough-dot ${
									i === activeStep
										? 'active'
										: i < activeStep
											? 'completed'
											: ''
								}`}
							/>
						))}
					</div>
					<div className='walkthrough-tooltip-actions'>
						<button
							className='walkthrough-btn walkthrough-btn-skip'
							onClick={handleSkip}
						>
							{isLastStep ? 'Close' : 'Skip'}
						</button>
						<button
							className='walkthrough-btn walkthrough-btn-next'
							onClick={handleNext}
						>
							{isLastStep ? 'Finish' : 'Next →'}
						</button>
					</div>
				</div>
			</div>
		</>,
		document.body,
	);
}
