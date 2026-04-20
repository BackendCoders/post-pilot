'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { SeoReport } from '@/types/seo.types';

interface SeoScoreBadgeProps {
	report: SeoReport;
}

const gradeColors = {
	A: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
	B: 'bg-green-500/10 text-green-600 border-green-200',
	C: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
	D: 'bg-orange-500/10 text-orange-600 border-orange-200',
	F: 'bg-red-500/10 text-red-600 border-red-200',
};

export function SeoScoreBadge({ report }: SeoScoreBadgeProps) {
	return (
		<div className='flex items-center gap-3'>
			<div
				className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 font-bold text-lg ${gradeColors[report.grade]}`}
			>
				{report.grade}
			</div>
			<div className='flex flex-col'>
				<span className='text-2xl font-bold'>{report.totalScore}</span>
				<span className='text-xs text-muted-foreground'>SEO Score</span>
			</div>
		</div>
	);
}

export function SeoSectionScore({
	score,
	maxScore = 100,
}: {
	score: number;
	maxScore?: number;
}) {
	const percentage = (score / maxScore) * 100;
	const color =
		percentage >= 80
			? 'bg-emerald-500'
			: percentage >= 60
				? 'bg-yellow-500'
				: 'bg-red-500';

	return (
		<div className='flex items-center gap-2'>
			<div className='w-full h-2 bg-muted rounded-full overflow-hidden'>
				<div
					className={`h-full rounded-full transition-all ${color}`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
			<span className='text-sm font-semibold min-w-[3ch]'>{score}</span>
		</div>
	);
}
