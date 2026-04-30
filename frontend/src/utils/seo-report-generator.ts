import type { ScrapedPageData, SeoReport, SectionResult } from '@/types/seo.types';

function clamp(value: number, min = 0, max = 100): number {
	return Math.max(min, Math.min(max, value));
}

function detectKeywordStuffing(paragraphs: string[]): number {
	const wordCounts: Record<string, number> = {};
	for (const p of paragraphs) {
		const words = p.toLowerCase().split(/\s+/);
		for (const word of words) {
			if (word.length > 3) {
				wordCounts[word] = (wordCounts[word] || 0) + 1;
			}
		}
	}
	return Object.values(wordCounts).filter((count) => count > 5).length;
}

function analyzeMeta(data: ScrapedPageData): SectionResult {
	let score = 100;
	const issues: SectionResult['issues'] = [];

	const metrics: Record<string, number> = {
		titleLength: data.title?.length || 0,
		hasMetaDescription: data.metaDescription ? 1 : 0,
		hasMetaKeywords: data.metaKeywords ? 1 : 0,
	};

	if (!data.title) {
		score -= 30;
		issues.push({
			message: 'Missing title',
			severity: 'high',
			fix: 'Add a title',
		});
	}

	if (!data.metaDescription) {
		score -= 25;
		issues.push({
			message: 'Missing meta description',
			severity: 'high',
			fix: 'Add description',
		});
	}

	if (data.title && data.title.length > 60) {
		score -= 10;
		issues.push({
			message: 'Title is too long',
			severity: 'medium',
			fix: 'Keep title under 60 characters',
		});
	}

	if (data.metaDescription && data.metaDescription.length > 160) {
		score -= 10;
		issues.push({
			message: 'Meta description is too long',
			severity: 'medium',
			fix: 'Keep meta description under 160 characters',
		});
	}

	return { score: clamp(score), maxScore: 100, issues, metrics };
}

function analyzeHeadings(data: ScrapedPageData): SectionResult {
	let score = 100;
	const issues: SectionResult['issues'] = [];

	const h = data.headings || { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };

	const metrics: Record<string, number> = {
		h1: (h.h1 || []).length,
		h2: (h.h2 || []).length,
		h3: (h.h3 || []).length,
		h4: (h.h4 || []).length,
		h5: (h.h5 || []).length,
		h6: (h.h6 || []).length,
	};

	if (metrics.h1 === 0) {
		score -= 40;
		issues.push({
			message: 'Missing H1',
			severity: 'high',
			fix: 'Add one H1',
		});
	} else if (metrics.h1 > 1) {
		score -= 25;
		issues.push({
			message: 'Multiple H1',
			severity: 'high',
			fix: 'Keep only one',
		});
	}

	return { score: clamp(score), maxScore: 100, issues, metrics };
}

function analyzeImages(data: ScrapedPageData): SectionResult {
	let score = 100;
	const issues: SectionResult['issues'] = [];

	let missingAlt = 0;
	let weakAlt = 0;
	let heavySize = 0;
	let criticalSize = 0;
	let nonModern = 0;
	let duplicates = 0;

	const seen = new Set<string>();

	const images = data.images || [];

	for (const img of images) {
		if (!img.alt) missingAlt++;
		else if (img.alt.split(' ').length < 3) weakAlt++;

		if (img.size > 400_000) criticalSize++;
		else if (img.size > 200_000) heavySize++;

		if (!['image/webp', 'image/avif'].includes(img.type)) {
			nonModern++;
		}

		if (img.src && seen.has(img.src)) duplicates++;
		else if (img.src) seen.add(img.src);
	}

	const metrics: Record<string, number> = {
		totalImages: images.length,
		missingAlt,
		weakAlt,
		heavyImages: heavySize,
		criticalImages: criticalSize,
		nonModernFormats: nonModern,
		duplicateImages: duplicates,
	};

	if (missingAlt) {
		score -= Math.min(25, missingAlt * 2);
		issues.push({
			message: `${missingAlt} image${missingAlt > 1 ? 's' : ''} missing alt text`,
			severity: 'high',
			fix: 'Add descriptive alt text to all images',
		});
	}

	if (criticalSize) {
		score -= Math.min(30, criticalSize * 5);
		issues.push({
			message: `${criticalSize} image${criticalSize > 1 ? 's' : ''} larger than 400KB`,
			severity: 'high',
			fix: 'Compress images to under 400KB (use WebP/AVIF or reduce quality)',
		});
	}

	if (heavySize) {
		score -= Math.min(20, heavySize * 3);
		issues.push({
			message: `${heavySize} image${heavySize > 1 ? 's' : ''} between 200KB-400KB`,
			severity: 'medium',
			fix: 'Consider compressing images in 200KB-400KB range',
		});
	}

	if (nonModern) {
		score -= Math.min(15, nonModern * 2);
		issues.push({
			message: `${nonModern} image${nonModern > 1 ? 's' : ''} not using modern formats`,
			severity: 'medium',
			fix: 'Convert images to WebP or AVIF format',
		});
	}

	if (duplicates) {
		score -= Math.min(10, duplicates * 2);
		issues.push({
			message: `${duplicates} duplicate image${duplicates > 1 ? 's' : ''}`,
			severity: 'low',
			fix: 'Remove duplicate images',
		});
	}

	if (weakAlt) {
		score -= Math.min(10, weakAlt * 2);
		issues.push({
			message: `${weakAlt} image${weakAlt > 1 ? 's' : ''} with weak alt text`,
			severity: 'low',
			fix: 'Add more descriptive alt text (at least 3 words)',
		});
	}

	return { score: clamp(score), maxScore: 100, issues, metrics };
}

function analyzeContent(data: ScrapedPageData): SectionResult {
	let score = 100;
	const issues: SectionResult['issues'] = [];

	const stuffing = detectKeywordStuffing(data.paragraphExcerpt || []);

	const metrics: Record<string, number> = {
		wordCount: data.wordCount || 0,
		paragraphCount: (data.paragraphExcerpt || []).length,
		keywordStuffingSignals: stuffing,
	};

	if (data.wordCount < 300) {
		score -= 40;
		issues.push({
			message: 'Content too short',
			severity: 'high',
			fix: 'Add more content (min 300 words)',
		});
	} else if (data.wordCount < 600) {
		score -= 15;
		issues.push({
			message: 'Content could be longer',
			severity: 'medium',
			fix: 'Aim for at least 600 words',
		});
	}

	if (stuffing > 10) {
		score -= 15;
		issues.push({
			message: 'Possible keyword stuffing detected',
			severity: 'medium',
			fix: 'Use keywords more naturally',
		});
	}

	return { score: clamp(score), maxScore: 100, issues, metrics };
}

function analyzeLinks(data: ScrapedPageData): SectionResult {
	let score = 100;
	const issues: SectionResult['issues'] = [];

	const links = data.links || [];
	const invalid = links.filter(
		(l: string) => l.includes('javascript:void') || l === 'tel:' || l === ''
	);

	const metrics: Record<string, number> = {
		totalLinks: links.length,
		internalLinks: data.internalLinkCount || 0,
		externalLinks: data.externalLinkCount || 0,
		invalidLinks: invalid.length,
	};

	if (invalid.length) {
		score -= Math.min(30, invalid.length * 5);
		issues.push({
			message: `${invalid.length} invalid links`,
			severity: 'high',
			fix: 'Fix or remove broken links',
		});
	}

	return { score: clamp(score), maxScore: 100, issues, metrics };
}

function analyzeTechnical(data: ScrapedPageData): SectionResult {
	let score = 100;
	const issues: SectionResult['issues'] = [];

	const metrics: Record<string, number> = {
		redirectCount: data.redirectCount || 0,
		hasCanonical: data.canonical ? 1 : 0,
		hasRobotsMeta: data.robotsMeta ? 1 : 0,
		hasError: data.isError ? 1 : 0,
	};

	if (!data.canonical) {
		score -= 15;
		issues.push({
			message: 'Missing canonical URL',
			severity: 'medium',
			fix: 'Add canonical tag',
		});
	}

	if (data.redirectCount > 0) {
		score -= data.redirectCount * 5;
		issues.push({
			message: `${data.redirectCount} redirects detected`,
			severity: 'medium',
			fix: 'Reduce redirect chains',
		});
	}

	if (data.isError) {
		score -= 50;
		issues.push({
			message: 'Page has errors',
			severity: 'high',
			fix: 'Fix page errors',
		});
	}

	return { score: clamp(score), maxScore: 100, issues, metrics };
}

function analyzePerformance(data: ScrapedPageData): SectionResult {
	let score = 100;
	const issues: SectionResult['issues'] = [];

	const perf = data.performanceMetrics;

	const metrics: Record<string, number> = {
		totalLoadTime: perf?.desktop?.totalLoadTime || 0,
		pageSize: perf?.pageSize || 0,
		ttfb: perf?.desktop?.ttfb || 0,
		dns: perf?.desktop?.dns || 0,
		tcp: perf?.desktop?.tcp || 0,
	};

	if (perf?.desktop?.totalLoadTime && perf.desktop.totalLoadTime > 5000) {
		score -= 20;
		issues.push({
			message: `Slow page load time (${Math.round(perf.desktop.totalLoadTime)}ms)`,
			severity: 'high',
			fix: 'Optimize server response time and reduce page weight',
		});
	} else if (perf?.desktop?.totalLoadTime && perf.desktop.totalLoadTime > 3000) {
		score -= 10;
		issues.push({
			message: `Moderate page load time (${Math.round(perf.desktop.totalLoadTime)}ms)`,
			severity: 'medium',
			fix: 'Consider optimizing for faster load times',
		});
	}

	if (perf?.pageSize && perf.pageSize > 5_000_000) {
		score -= 15;
		issues.push({
			message: `Large page size (${perf.pageSizeFormatted})`,
			severity: 'high',
			fix: 'Compress resources and remove unused code',
		});
	} else if (perf?.pageSize && perf.pageSize > 2_000_000) {
		score -= 10;
		issues.push({
			message: `Heavy page size (${perf.pageSizeFormatted})`,
			severity: 'medium',
			fix: 'Consider reducing page weight',
		});
	}

	if (perf?.desktop?.ttfb && perf.desktop.ttfb > 1800) {
		score -= 10;
		issues.push({
			message: `High TTFB (${Math.round(perf.desktop.ttfb)}ms)`,
			severity: 'medium',
			fix: 'Improve server response time',
		});
	}

	if (perf?.desktop?.dns && perf.desktop.dns > 500) {
		score -= 5;
		issues.push({
			message: `Slow DNS lookup (${Math.round(perf.desktop.dns)}ms)`,
			severity: 'low',
			fix: 'Consider using DNS prefetch',
		});
	}

	if (perf?.desktop?.tcp && perf.desktop.tcp > 1000) {
		score -= 5;
		issues.push({
			message: `Slow TCP connection (${Math.round(perf.desktop.tcp)}ms)`,
			severity: 'low',
			fix: 'Consider using a CDN or closer server',
		});
	}

	return { score: clamp(score), maxScore: 100, issues, metrics };
}

export function generateReportFromScrapedData(data: ScrapedPageData): SeoReport {
	const sections = {
		meta: analyzeMeta(data),
		headings: analyzeHeadings(data),
		images: analyzeImages(data),
		content: analyzeContent(data),
		links: analyzeLinks(data),
		technical: analyzeTechnical(data),
		performance: analyzePerformance(data),
	};

	const total =
		Object.values(sections).reduce((sum, s) => sum + s.score, 0) /
		Object.keys(sections).length;

	const grade: SeoReport['grade'] =
		total >= 90
			? 'A'
			: total >= 80
				? 'B'
				: total >= 70
					? 'C'
					: total >= 60
						? 'D'
						: 'F';

	return {
		totalScore: Math.round(total),
		grade,
		sections,
	};
}

export function generateReportsFromScrapedData(
	results: ScrapedPageData[]
): Record<string, SeoReport> {
	const reports: Record<string, SeoReport> = {};
	for (const page of results) {
		try {
			reports[page.url] = generateReportFromScrapedData(page);
		} catch (e) {
			console.warn(`Failed to generate report for ${page.url}:`, e);
		}
	}
	return reports;
}
