import React from 'react';
import { cn } from '@/lib/utils';

export type DonutSegment = {
	label: string;
	value: number;
	colorVar: `--${string}`;
};

export default function DonutChart({
	segments,
	size = 108,
	thickness = 12,
	centerLabel,
	centerValue,
	className,
	ariaLabel,
}: {
	segments: DonutSegment[];
	size?: number;
	thickness?: number;
	centerLabel?: string;
	centerValue?: string;
	className?: string;
	ariaLabel?: string;
}) {
	const total = segments.reduce((sum, s) => sum + (Number.isFinite(s.value) ? s.value : 0), 0);
	const safeTotal = total > 0 ? total : 1;

	const radius = (size - thickness) / 2;
	const circumference = 2 * Math.PI * radius;

	// Start at 12 o'clock.
	const rotation = -90;

	const computed = React.useMemo(() => {
		let offset = 0;
		return segments.map((s) => {
			const value = Number.isFinite(s.value) ? s.value : 0;
			const dash = (value / safeTotal) * circumference;
			const dashArray = `${dash} ${Math.max(0, circumference - dash)}`;
			const dashOffset = -offset;
			offset += dash;
			return {
				segment: s,
				dashArray,
				dashOffset,
			};
		});
	}, [circumference, safeTotal, segments]);

	return (
		<div className={cn('relative inline-flex items-center justify-center', className)}>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				role='img'
				aria-label={ariaLabel}
				className='block'
			>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill='none'
					stroke='var(--border)'
					strokeWidth={thickness}
					opacity={0.35}
				/>

				<g transform={`rotate(${rotation} ${size / 2} ${size / 2})`}>
					{computed.map((c) => {
						return (
							<circle
								key={c.segment.label}
								cx={size / 2}
								cy={size / 2}
								r={radius}
								fill='none'
								stroke={`var(${c.segment.colorVar})`}
								strokeWidth={thickness}
								strokeDasharray={c.dashArray}
								strokeDashoffset={c.dashOffset}
								strokeLinecap='butt'
							/>
						);
					})}
				</g>
			</svg>

			<div className='absolute inset-0 grid place-items-center text-center'>
				{centerValue ? (
					<div>
						<div className='text-xl font-semibold tracking-tight'>{centerValue}</div>
						{centerLabel ? (
							<div className='text-[11px] leading-tight text-muted-foreground'>
								{centerLabel}
							</div>
						) : null}
					</div>
				) : null}
			</div>
		</div>
	);
}
