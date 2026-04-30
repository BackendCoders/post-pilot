import { onFCP, onLCP, onCLS, onINP, onTTFB } from 'web-vitals';
import type { PerformanceMetrics } from '@/types/seo.types';

export interface WebVitalsResult {
	fcp: number | null;
	lcp: number | null;
	cls: number | null;
	inp: number | null;
	ttfb: number | null;
}

export type Rating = 'good' | 'needs-improvement' | 'poor';

export function getFcpRating(value: number | null): Rating | null {
	if (value === null) return null;
	if (value <= 1800) return 'good';
	if (value <= 3000) return 'needs-improvement';
	return 'poor';
}

export function getLcpRating(value: number | null): Rating | null {
	if (value === null) return null;
	if (value <= 2500) return 'good';
	if (value <= 4000) return 'needs-improvement';
	return 'poor';
}

export function getInpRating(value: number | null): Rating | null {
	if (value === null) return null;
	if (value <= 200) return 'good';
	if (value <= 500) return 'needs-improvement';
	return 'poor';
}

export function getClsRating(value: number | null): Rating | null {
	if (value === null) return null;
	if (value <= 0.1) return 'good';
	if (value <= 0.25) return 'needs-improvement';
	return 'poor';
}

export function getTtfbRating(value: number | null): Rating | null {
	if (value === null) return null;
	if (value <= 800) return 'good';
	if (value <= 1800) return 'needs-improvement';
	return 'poor';
}

export function calculateOverallScore(metrics: WebVitalsResult): number | null {
	const { fcp, lcp, cls, inp, ttfb } = metrics;
	const values: { value: number; good: number; poor: number }[] = [
		{ value: fcp ?? -1, good: 1800, poor: 3000 },
		{ value: lcp ?? -1, good: 2500, poor: 4000 },
		{ value: cls ?? -1, good: 0.1, poor: 0.25 },
		{ value: inp ?? -1, good: 200, poor: 500 },
		{ value: ttfb ?? -1, good: 800, poor: 1800 },
	];

	const validScores = values
		.filter(v => v.value >= 0)
		.map(v => {
			if (v.value <= v.good) return 100;
			if (v.value >= v.poor) return 0;
			return Math.round(100 - ((v.value - v.good) / (v.poor - v.good)) * 100);
		});

	if (validScores.length === 0) return null;

	return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
}

export function measureWebVitals(): Promise<WebVitalsResult> {
	return new Promise((resolve) => {
		const result: WebVitalsResult = {
			fcp: null,
			lcp: null,
			cls: null,
			inp: null,
			ttfb: null,
		};

		let completed = 0;
		const total = 5;

		const checkComplete = () => {
			completed++;
			if (completed >= total) {
				resolve(result);
			}
		};

		const timeout = setTimeout(() => {
			for (let i = 0; i < total; i++) checkComplete();
		}, 10000);

		try {
			onFCP((metric) => {
				result.fcp = metric.value;
				clearTimeout(timeout);
				checkComplete();
			});
		} catch {
			checkComplete();
		}

		try {
			onLCP((metric) => {
				result.lcp = metric.value;
				clearTimeout(timeout);
				checkComplete();
			});
		} catch {
			checkComplete();
		}

		try {
			onCLS((metric) => {
				result.cls = metric.delta;
				clearTimeout(timeout);
				checkComplete();
			});
		} catch {
			checkComplete();
		}

		try {
			onINP((metric) => {
				result.inp = metric.value;
				clearTimeout(timeout);
				checkComplete();
			});
		} catch {
			checkComplete();
		}

		try {
			onTTFB((metric) => {
				result.ttfb = metric.value;
				clearTimeout(timeout);
				checkComplete();
			});
		} catch {
			checkComplete();
		}
	});
}

export function mergeWithBackendMetrics(
	backendMetrics: PerformanceMetrics | null,
	webVitals: WebVitalsResult
): PerformanceMetrics {
	const baseMetrics: PerformanceMetrics = backendMetrics || {
		desktop: {
			ttfb: 0,
			dns: 0,
			tcp: 0,
			firstByte: 0,
			contentDownload: 0,
			totalLoadTime: 0,
		},
		mobile: {
			ttfb: 0,
			dns: 0,
			tcp: 0,
			firstByte: 0,
			contentDownload: 0,
			totalLoadTime: 0,
		},
		pageSize: 0,
		pageSizeFormatted: '0 Bytes',
		fcp: null,
		lcp: null,
		fid: null,
		cls: null,
		inp: null,
		tbt: null,
		fcpRating: null,
		lcpRating: null,
		fidRating: null,
		clsRating: null,
		inpRating: null,
		tbtRating: null,
		overallPerformanceScore: null,
	};

	return {
		...baseMetrics,
		fcp: webVitals.fcp,
		lcp: webVitals.lcp,
		cls: webVitals.cls,
		inp: webVitals.inp,
		desktop: {
			...baseMetrics.desktop,
			ttfb: webVitals.ttfb ?? baseMetrics.desktop.ttfb,
		},
		fcpRating: getFcpRating(webVitals.fcp),
		lcpRating: getLcpRating(webVitals.lcp),
		clsRating: getClsRating(webVitals.cls),
		inpRating: getInpRating(webVitals.inp),
		overallPerformanceScore: calculateOverallScore(webVitals),
	};
}

export function formatMetricValue(value: number | null, unit: string = 'ms'): string {
	if (value === null) return '-';
	return `${Math.round(value)}${unit}`;
}

export function getMetricColor(rating: Rating | null): string {
	switch (rating) {
		case 'good':
			return 'text-emerald-600';
		case 'needs-improvement':
			return 'text-yellow-600';
		case 'poor':
			return 'text-red-600';
		default:
			return 'text-muted-foreground';
	}
}

export function getMetricBgColor(rating: Rating | null): string {
	switch (rating) {
		case 'good':
			return 'bg-emerald-500/10 border-emerald-500/20';
		case 'needs-improvement':
			return 'bg-yellow-500/10 border-yellow-500/20';
		case 'poor':
			return 'bg-red-500/10 border-red-500/20';
		default:
			return 'bg-muted/10 border-muted/20';
	}
}
