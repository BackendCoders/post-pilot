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
		hasOgTitle: data.openGraph?.title ? 1 : 0,
		hasOgDescription: data.openGraph?.description ? 1 : 0,
		hasOgImage: data.openGraph?.image ? 1 : 0,
		hasTwitterCard: data.twitterCard?.card ? 1 : 0,
		hasTwitterTitle: data.twitterCard?.title ? 1 : 0,
		hasTwitterDescription: data.twitterCard?.description ? 1 : 0,
		hasTwitterImage: data.twitterCard?.image ? 1 : 0,
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

	// Social Preview (Open Graph + Twitter Card)
	if (!data.openGraph?.title) {
		score -= 10;
		issues.push({
			message: 'Missing Open Graph title (og:title)',
			severity: 'high',
			fix: 'Add <meta property="og:title" content="...">',
		});
	}

	if (!data.openGraph?.description) {
		score -= 10;
		issues.push({
			message: 'Missing Open Graph description (og:description)',
			severity: 'high',
			fix: 'Add <meta property="og:description" content="...">',
		});
	}

	if (!data.openGraph?.image) {
		score -= 10;
		issues.push({
			message: 'Missing Open Graph image (og:image)',
			severity: 'high',
			fix: 'Add <meta property="og:image" content="https://..."> (recommended 1200×630)',
		});
	}

	if (!data.twitterCard?.card) {
		score -= 6;
		issues.push({
			message: 'Missing Twitter Card type (twitter:card)',
			severity: 'medium',
			fix: 'Add <meta name="twitter:card" content="summary_large_image">',
		});
	}

	if (!data.twitterCard?.title) {
		score -= 6;
		issues.push({
			message: 'Missing Twitter title (twitter:title)',
			severity: 'medium',
			fix: 'Add <meta name="twitter:title" content="...">',
		});
	}

	if (!data.twitterCard?.description) {
		score -= 6;
		issues.push({
			message: 'Missing Twitter description (twitter:description)',
			severity: 'medium',
			fix: 'Add <meta name="twitter:description" content="...">',
		});
	}

	if (!data.twitterCard?.image) {
		score -= 6;
		issues.push({
			message: 'Missing Twitter image (twitter:image)',
			severity: 'medium',
			fix: 'Add <meta name="twitter:image" content="https://..."> (recommended 1200×630)',
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

	const details: any = {
		missingAlt: [],
		weakAlt: [],
		heavyImages: [],
		criticalImages: [],
		nonModernFormats: [],
		duplicateImages: [],
		brokenImages: [],
	};

	for (const img of images) {
		if (!img.alt) {
			missingAlt++;
			details.missingAlt.push(img.src);
		} else if (img.alt.split(' ').length < 3) {
			weakAlt++;
			details.weakAlt.push({ src: img.src, alt: img.alt });
		}

		if (img.size > 400_000) {
			criticalSize++;
			details.criticalImages.push({ src: img.src, size: img.size });
		} else if (img.size > 200_000) {
			heavySize++;
			details.heavyImages.push({ src: img.src, size: img.size });
		}

		if (!['image/webp', 'image/avif'].includes(img.type)) {
			nonModern++;
			details.nonModernFormats.push({ src: img.src, type: img.type });
		}

		if (img.src && seen.has(img.src)) {
			duplicates++;
			details.duplicateImages.push(img.src);
		} else if (img.src) {
			seen.add(img.src);
		}
	}
	const metrics: Record<string, number> = {
		totalImages: images.length,
		missingAlt,
		weakAlt,
		heavyImages: heavySize,
		criticalImages: criticalSize,
		nonModernFormats: nonModern,
		duplicateImages: duplicates,
		brokenImages: 0,
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

	return { score: clamp(score), maxScore: 100, issues, metrics, details };
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
	const internalLinks = links.filter((l) => l.isInternal);
	const externalLinks = links.filter((l) => !l.isInternal);
	const brokenLinks = internalLinks.filter((l) => l.isBroken);
	const NON_DESCRIPTIVE = ['click here', 'here', 'read more', 'more', 'learn more', 'this', 'link', 'page'];
	const nonDescriptiveLinks = internalLinks.filter((l) => {
		const t = l.text.toLowerCase().trim();
		return !t || NON_DESCRIPTIVE.includes(t);
	});
	const externalNoNofollow = externalLinks.filter((l) => {
		const rel = (l.rel || '').toLowerCase();
		return !rel.includes('nofollow');
	});

	const details: any = {
		allLinks: links,
		internalLinks,
		externalLinks,
		brokenLinks,
		nonDescriptiveLinks,
		externalNoNofollow,
	};

	const metrics: Record<string, number> = {
		totalLinks: links.length,
		internalLinks: internalLinks.length,
		externalLinks: externalLinks.length,
		brokenLinks: brokenLinks.length,
	};

	if (brokenLinks.length > 0) {
		score -= Math.min(30, brokenLinks.length * 10);
		issues.push({
			message: `${brokenLinks.length} broken internal link${brokenLinks.length > 1 ? 's' : ''} (404)`,
			severity: 'high',
			fix: 'Fix or remove 404 URLs',
		});
	}

	if (nonDescriptiveLinks.length > 0) {
		score -= Math.min(15, nonDescriptiveLinks.length * 3);
		issues.push({
			message: `${nonDescriptiveLinks.length} link${nonDescriptiveLinks.length > 1 ? 's' : ''} with non-descriptive anchor text`,
			severity: 'medium',
			fix: 'Replace generic anchor text with descriptive keyword-rich text',
		});
	}

	if (externalNoNofollow.length > 0) {
		score -= Math.min(10, externalNoNofollow.length * 2);
		issues.push({
			message: `${externalNoNofollow.length} external link${externalNoNofollow.length > 1 ? 's' : ''} missing rel="nofollow"`,
			severity: 'low',
			fix: 'Add rel="nofollow" to untrusted external links',
		});
	}

	return { score: clamp(score), maxScore: 100, issues, metrics, details };
}

function analyzeTechnical(data: ScrapedPageData): SectionResult {
	let score = 100;
	const issues: SectionResult['issues'] = [];

	const requestedUrl = data.requestedUrl || data.url;
	const finalUrl = data.finalUrl || data.url;

	const ssl = {
		requestedProtocol: requestedUrl.startsWith('https://')
			? 'https'
			: requestedUrl.startsWith('http://')
				? 'http'
				: 'unknown',
		finalProtocol: finalUrl.startsWith('https://')
			? 'https'
			: finalUrl.startsWith('http://')
				? 'http'
				: 'unknown',
		isHttps: finalUrl.startsWith('https://'),
	};

	let urlStructure = {
		pathname: '',
		pathLength: 0,
		hasUppercase: false,
		hasUnderscore: false,
		hasDisallowedQueryParams: false,
		disallowedParams: [] as string[],
		isPathTooLong: false,
		isClean: true,
	};

	try {
		const parsed = new URL(finalUrl);
		const pathname = parsed.pathname || '';
		const pathLength = pathname.length;
		const hasUppercase = /[A-Z]/.test(pathname);
		const hasUnderscore = pathname.includes('_');

		const allowParam = (key: string) => {
			const lower = key.toLowerCase();
			return lower.startsWith('utm_') || lower === 'gclid' || lower === 'fbclid';
		};

		const disallowedParams: string[] = [];
		for (const key of parsed.searchParams.keys()) {
			if (!allowParam(key)) disallowedParams.push(key);
		}

		const hasDisallowedQueryParams = disallowedParams.length > 0;
		const isPathTooLong = pathLength > 80;

		urlStructure = {
			pathname,
			pathLength,
			hasUppercase,
			hasUnderscore,
			hasDisallowedQueryParams,
			disallowedParams,
			isPathTooLong,
			isClean:
				!hasUppercase &&
				!hasUnderscore &&
				!hasDisallowedQueryParams &&
				!isPathTooLong,
		};
	} catch {
		// ignore URL parsing errors in UI-side generator
	}

	const metrics: Record<string, number> = {
		redirectCount: data.redirectCount || 0,
		hasCanonical: data.canonical ? 1 : 0,
		hasRobotsMeta: data.robotsMeta ? 1 : 0,
		hasError: data.isError ? 1 : 0,
		isHttps: ssl.isHttps ? 1 : 0,
		isCleanUrl: urlStructure.isClean ? 1 : 0,
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

	if (!ssl.isHttps) {
		score -= 25;
		issues.push({
			message: 'Page is not served over HTTPS (SSL)',
			severity: 'high',
			fix: 'Enable SSL and ensure the page is accessible over https://',
		});
	} else if (ssl.requestedProtocol === 'http' && ssl.finalProtocol === 'https') {
		score -= 5;
		issues.push({
			message: 'HTTP redirects to HTTPS (recommended: use HTTPS links directly)',
			severity: 'low',
			fix: 'Update links to use https:// directly to reduce redirects',
		});
	}

	if (urlStructure.hasUppercase) {
		score -= 10;
		issues.push({
			message: 'URL path contains uppercase characters',
			severity: 'medium',
			fix: 'Use lowercase URLs (e.g., /my-page instead of /My-Page)',
		});
	}

	if (urlStructure.hasUnderscore) {
		score -= 10;
		issues.push({
			message: 'URL path contains underscores',
			severity: 'medium',
			fix: 'Use hyphens instead of underscores in URLs (e.g., /my-page)',
		});
	}

	if (urlStructure.hasDisallowedQueryParams) {
		score -= 10;
		issues.push({
			message: 'URL contains dynamic query parameters',
			severity: 'medium',
			fix: 'Avoid dynamic parameters in indexable URLs; keep URLs readable',
			currentValue: urlStructure.disallowedParams.join(', '),
		});
	}

	if (urlStructure.isPathTooLong) {
		score -= 5;
		issues.push({
			message: 'URL path is very long',
			severity: 'low',
			fix: 'Keep URLs short and readable where possible',
			currentValue: String(urlStructure.pathLength),
		});
	}

	// Inline CSS/JS + Minification + Schema (warnings + small bonuses)
	const inlineScriptsBytes = data.inlineScriptsBytes || 0;
	const largestInlineScriptBytes = data.largestInlineScriptBytes || 0;
	const inlineStylesBytes = data.inlineStylesBytes || 0;
	const largestInlineStyleBytes = data.largestInlineStyleBytes || 0;

	const isHeavyInline =
		largestInlineScriptBytes > 10_000 ||
		inlineScriptsBytes > 30_000 ||
		largestInlineStyleBytes > 5_000 ||
		inlineStylesBytes > 15_000;

	if (isHeavyInline) {
		issues.push({
			message: 'Heavy inline CSS/JS detected',
			severity: 'medium',
			fix: 'Move large inline <script>/<style> blocks into external files to improve caching',
		});
	}

	const totalJsCount = data.totalJsCount || 0;
	const minifiedJsCount = data.minifiedJsCount || 0;
	const totalCssCount = data.totalCssCount || 0;
	const minifiedCssCount = data.minifiedCssCount || 0;
	const jsMinRatio = totalJsCount > 0 ? minifiedJsCount / totalJsCount : 1;
	const cssMinRatio = totalCssCount > 0 ? minifiedCssCount / totalCssCount : 1;
	const hasGoodMinification = jsMinRatio >= 0.5 && cssMinRatio >= 0.5;

	if (!hasGoodMinification && (totalJsCount > 0 || totalCssCount > 0)) {
		issues.push({
			message: 'Assets are not consistently minified',
			severity: 'medium',
			fix: 'Serve minified and compressed CSS/JS in production builds (commonly .min.css/.min.js)',
			currentValue: `JS ${minifiedJsCount}/${totalJsCount}, CSS ${minifiedCssCount}/${totalCssCount}`,
		});
	}

	const hasSchemaMarkup = Boolean(data.hasSchemaMarkup);
	const schemaErrors = data.schemaErrors || [];
	const hasSchemaErrors = schemaErrors.length > 0;
	const hasBreadcrumbSchema = Boolean(data.hasBreadcrumbSchema);
	const hasBreadcrumbLinks = Boolean(data.hasBreadcrumbLinks);

	if (!hasSchemaMarkup) {
		issues.push({
			message: 'No Schema Markup (JSON-LD) detected',
			severity: 'low',
			fix: 'Add JSON-LD schema (e.g., Product, Article, Organization) to enable rich snippets',
		});
	}

	if (hasSchemaErrors) {
		issues.push({
			message: 'Schema Markup contains errors',
			severity: 'high',
			fix: 'Fix JSON-LD syntax/structure and re-validate using Schema Markup Validator (schema.org)',
			currentValue: String(schemaErrors.length),
		});
	}

	if (!hasBreadcrumbSchema && !hasBreadcrumbLinks) {
		issues.push({
			message: 'No breadcrumbs detected',
			severity: 'low',
			fix: 'Add breadcrumb navigation and/or BreadcrumbList schema to improve UX and crawling',
		});
	}

	let bonusPoints = 0;
	if (!hasSchemaErrors) {
		if (hasSchemaMarkup) bonusPoints += 3;
		if (hasBreadcrumbSchema || hasBreadcrumbLinks) bonusPoints += 2;
	}
	if (hasGoodMinification) bonusPoints += 2;
	if (!isHeavyInline) bonusPoints += 1;

	score = score + bonusPoints;

	return {
		score: clamp(score),
		maxScore: 100,
		bonusPoints,
		issues,
		metrics,
		details: {
			requestedUrl,
			finalUrl,
			ssl,
			urlStructure,
			inline: {
				inlineScriptsCount: data.inlineScriptsCount || 0,
				inlineScriptsBytes,
				largestInlineScriptBytes,
				inlineStylesCount: data.inlineStylesCount || 0,
				inlineStylesBytes,
				largestInlineStyleBytes,
			},
			minification: {
				totalJsCount,
				minifiedJsCount,
				totalCssCount,
				minifiedCssCount,
			},
			schema: {
				jsonLdBlocksCount: data.jsonLdBlocksCount || 0,
				jsonLdItemsCount: data.jsonLdItemsCount || 0,
				jsonLdTypes: data.jsonLdTypes || [],
				schemaErrors,
				hasSchemaMarkup,
				hasBreadcrumbSchema,
				hasBreadcrumbLinks,
			},
		},
	};
}

function analyzePerformance(data: ScrapedPageData): SectionResult {
	let score = 100;
	const issues: SectionResult['issues'] = [];

	const perf = data.performanceMetrics;

	const details: any = {
		renderBlocking: [],
		largeResources: [],
		allResources: [],
	};

	const scripts = data.scripts || [];
	const stylesheets = data.stylesheets || [];

	// Analyze Scripts
	let renderBlockingCount = 0;
	let largeJsCount = 0;
	for (const script of scripts) {
		const isBlocking = !script.isAsync && !script.isDefer;
		const isLarge = script.size > 100000; // 100KB

		if (isBlocking) {
			renderBlockingCount++;
			details.renderBlocking.push({ url: script.src, type: 'js' });
		}
		if (isLarge) {
			largeJsCount++;
			details.largeResources.push({ url: script.src, size: script.size, type: 'js' });
		}
		details.allResources.push({
			url: script.src,
			size: script.size,
			type: 'js',
			isBlocking,
		});
	}

	// Analyze Stylesheets
	let largeCssCount = 0;
	for (const css of stylesheets) {
		const isLarge = css.size > 50000; // 50KB
		if (isLarge) {
			largeCssCount++;
			details.largeResources.push({ url: css.href, size: css.size, type: 'css' });
		}
		details.renderBlocking.push({ url: css.href, type: 'css' });
		details.allResources.push({
			url: css.href,
			size: css.size,
			type: 'css',
			isBlocking: true,
		});
	}

	const totalBlockingCount = renderBlockingCount + stylesheets.length;

	const metrics: Record<string, number> = {
		totalLoadTime: perf?.desktop?.totalLoadTime || 0,
		pageSize: perf?.pageSize || 0,
		ttfb: perf?.desktop?.ttfb || 0,
		dns: perf?.desktop?.dns || 0,
		tcp: perf?.desktop?.tcp || 0,
		renderBlockingResources: totalBlockingCount,
		largeResources: largeJsCount + largeCssCount,
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

	return { score: clamp(score), maxScore: 100, issues, metrics, details };
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
