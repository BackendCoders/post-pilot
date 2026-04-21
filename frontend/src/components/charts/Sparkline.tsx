import React from 'react';
import { cn } from '@/lib/utils';

function clamp01(v: number) {
	if (!Number.isFinite(v)) return 0;
	if (v < 0) return 0;
	if (v > 1) return 1;
	return v;
}

export default function Sparkline({
	data,
	width = 260,
	height = 76,
	strokeVar = '--chart-1',
	fillVar = '--chart-1',
	className,
	ariaLabel,
}: {
	data: number[];
	width?: number;
	height?: number;
	strokeVar?: `--${string}`;
	fillVar?: `--${string}`;
	className?: string;
	ariaLabel?: string;
}) {
	const safe = data.map((n) => (Number.isFinite(n) ? n : 0));
	const max = Math.max(1, ...safe);
	const min = Math.min(0, ...safe);
	const range = Math.max(1, max - min);

	const padX = 6;
	const padY = 8;
	const w = Math.max(1, width - padX * 2);
	const h = Math.max(1, height - padY * 2);

	const points = safe.map((v, i) => {
		const t = safe.length <= 1 ? 0 : i / (safe.length - 1);
		const x = padX + t * w;
		const y = padY + (1 - clamp01((v - min) / range)) * h;
		return { x, y };
	});

	const lineD =
		points.length > 0
			? `M ${points[0].x} ${points[0].y} ` +
				points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
			: '';

	const areaD =
		points.length > 0
			? `${lineD} L ${points[points.length - 1].x} ${padY + h} L ${points[0].x} ${
					padY + h
				} Z`
			: '';

	const gradientId = React.useId();

	return (
		<svg
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			role='img'
			aria-label={ariaLabel}
			className={cn('block overflow-visible', className)}
		>
			<defs>
				<linearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor={`var(${fillVar})`} stopOpacity={0.22} />
					<stop offset='100%' stopColor={`var(${fillVar})`} stopOpacity={0} />
				</linearGradient>
			</defs>

			{areaD ? <path d={areaD} fill={`url(#${gradientId})`} /> : null}
			{lineD ? (
				<path
					d={lineD}
					fill='none'
					stroke={`var(${strokeVar})`}
					strokeWidth={2}
					strokeLinejoin='round'
					strokeLinecap='round'
				/>
			) : null}
		</svg>
	);
}

