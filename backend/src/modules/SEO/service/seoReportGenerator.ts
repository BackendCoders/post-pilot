import { ScrapedPageData, ISectionResult, ISeoReport } from '../../../types';

export const generateSeoReport = (data: ScrapedPageData): ISeoReport => {
	const createEmptySection = (): ISectionResult => ({
		score: 100,
		maxScore: 100,
		bonusPoints: 0,
		issues: [],
		metrics: {},
		details: {},
	});

	const sections: ISeoReport['sections'] = {
		meta: createEmptySection(),
		headings: createEmptySection(),
		images: createEmptySection(),
		content: createEmptySection(),
		links: createEmptySection(),
		technical: createEmptySection(),
		performance: createEmptySection(),
	};

	// --- 1. Meta Audit ---
	sections.meta.details = {
		title: data.title,
		metaDescription: data.metaDescription,
		metaKeywords: data.metaKeywords,
		url: data.url,
		openGraph: data.openGraph || { title: null, description: null, image: null },
		twitterCard: data.twitterCard || { card: null, title: null, description: null, image: null },
	};

	if (!data.title) {
		sections.meta.issues.push({
			message: 'Missing title tag',
			severity: 'high',
			fix: 'Add a <title> tag to your page head.',
		});
	} else if (data.title.length > 60) {
		sections.meta.issues.push({
			message: 'Title too long',
			severity: 'medium',
			fix: 'Shorten title to under 60 characters.',
			currentValue: data.title,
		});
	}

	if (!data.metaDescription) {
		sections.meta.issues.push({
			message: 'Missing meta description',
			severity: 'high',
			fix: 'Add a <meta name="description"> tag.',
		});
	} else if (data.metaDescription.length > 160) {
		sections.meta.issues.push({
			message: 'Meta description too long',
			severity: 'medium',
			fix: 'Shorten description to under 160 characters.',
			currentValue: data.metaDescription,
		});
	}

	// --- Social Preview (Open Graph + Twitter Card) ---
	const og = data.openGraph || { title: null, description: null, image: null };
	const tw = data.twitterCard || { card: null, title: null, description: null, image: null };

	if (!og.title) {
		sections.meta.issues.push({
			message: 'Missing Open Graph title (og:title)',
			severity: 'high',
			fix: 'Add <meta property="og:title" content="..."> to define the share title.',
		});
	}

	if (!og.description) {
		sections.meta.issues.push({
			message: 'Missing Open Graph description (og:description)',
			severity: 'high',
			fix: 'Add <meta property="og:description" content="..."> to define the share description.',
		});
	}

	if (!og.image) {
		sections.meta.issues.push({
			message: 'Missing Open Graph image (og:image)',
			severity: 'high',
			fix: 'Add <meta property="og:image" content="https://..."> with a share-friendly image (recommended 1200×630).',
		});
	}

	if (!tw.card) {
		sections.meta.issues.push({
			message: 'Missing Twitter Card type (twitter:card)',
			severity: 'medium',
			fix: 'Add <meta name="twitter:card" content="summary_large_image"> to define the card type.',
		});
	}

	if (!tw.title) {
		sections.meta.issues.push({
			message: 'Missing Twitter title (twitter:title)',
			severity: 'medium',
			fix: 'Add <meta name="twitter:title" content="..."> to define the Twitter share title.',
		});
	}

	if (!tw.description) {
		sections.meta.issues.push({
			message: 'Missing Twitter description (twitter:description)',
			severity: 'medium',
			fix: 'Add <meta name="twitter:description" content="..."> to define the Twitter share description.',
		});
	}

	if (!tw.image) {
		sections.meta.issues.push({
			message: 'Missing Twitter image (twitter:image)',
			severity: 'medium',
			fix: 'Add <meta name="twitter:image" content="https://..."> with a share-friendly image (recommended 1200×630).',
		});
	}

	// --- 2. Headings Audit ---
	const h1s = data.headings?.h1 || [];
	if (h1s.length === 0) {
		sections.headings.issues.push({
			message: 'Missing H1 tag',
			severity: 'high',
			fix: 'Add exactly one H1 tag to your page.',
		});
	} else if (h1s.length > 1) {
		sections.headings.issues.push({
			message: 'Multiple H1 tags',
			severity: 'medium',
			fix: 'Ensure only one H1 tag is present.',
			currentValue: h1s.join(', '),
		});
	}

	const headingDetails: any[] = [];
	Object.entries(data.headings || {}).forEach(([type, texts]) => {
		(texts as string[]).forEach((text) => {
			headingDetails.push({ type, text });
		});
	});
	sections.headings.details = { headings: headingDetails };

	// --- 3. Images Audit ---
	const brokenImages = data.images.filter(img => img.isBroken);
	const missingAlt = data.images.filter(img => !img.alt);
	const missingLazyLoad = data.images.filter(img => img.loading !== 'lazy');
	
	sections.images.details = {
		brokenImages,
		missingAlt,
		missingLazyLoad,
		totalImages: data.images.length
	};

	if (brokenImages.length > 0) {
		sections.images.issues.push({
			message: 'Broken images found',
			severity: 'high',
			fix: 'Update or remove broken image sources.',
			currentValue: `${brokenImages.length} images`
		});
	}

	if (missingLazyLoad.length > 0) {
		sections.images.issues.push({
			message: 'Images missing lazy loading',
			severity: 'medium',
			fix: 'Implement loading="lazy" for below-the-fold images to improve page performance.',
			currentValue: `${missingLazyLoad.length} images`
		});
	}

	// --- 4. Technical Audit ---
	const requestedUrl = (data as any).requestedUrl || data.url;
	const finalUrl = (data as any).finalUrl || data.url;

	const sslDetails = (() => {
		const requestedProtocol = requestedUrl?.startsWith('https://')
			? 'https'
			: requestedUrl?.startsWith('http://')
				? 'http'
				: 'unknown';
		const finalProtocol = finalUrl?.startsWith('https://')
			? 'https'
			: finalUrl?.startsWith('http://')
				? 'http'
				: 'unknown';
		return {
			requestedProtocol,
			finalProtocol,
			isHttps: finalProtocol === 'https',
		};
	})();

	const urlStructureDetails = (() => {
		let parsed: URL | null = null;
		try {
			parsed = new URL(finalUrl || requestedUrl || data.url);
		} catch {
			parsed = null;
		}

		const pathname = parsed?.pathname || '';
		const pathLength = pathname.length;
		const hasUppercase = /[A-Z]/.test(pathname);
		const hasUnderscore = pathname.includes('_');

		const allowParam = (key: string) => {
			const lower = key.toLowerCase();
			return lower.startsWith('utm_') || lower === 'gclid' || lower === 'fbclid';
		};

		const disallowedParams: string[] = [];
		if (parsed) {
			for (const key of parsed.searchParams.keys()) {
				if (!allowParam(key)) {
					disallowedParams.push(key);
				}
			}
		}

		const hasDisallowedQueryParams = disallowedParams.length > 0;
		const isPathTooLong = pathLength > 80;

		return {
			requestedUrl,
			finalUrl,
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
	})();

	sections.technical.details = {
		requestedUrl,
		finalUrl,
		ssl: sslDetails,
		urlStructure: urlStructureDetails,
		inline: {
			inlineScriptsCount: (data as any).inlineScriptsCount || 0,
			inlineScriptsBytes: (data as any).inlineScriptsBytes || 0,
			largestInlineScriptBytes: (data as any).largestInlineScriptBytes || 0,
			inlineStylesCount: (data as any).inlineStylesCount || 0,
			inlineStylesBytes: (data as any).inlineStylesBytes || 0,
			largestInlineStyleBytes: (data as any).largestInlineStyleBytes || 0,
		},
		minification: {
			totalJsCount: (data as any).totalJsCount || 0,
			minifiedJsCount: (data as any).minifiedJsCount || 0,
			totalCssCount: (data as any).totalCssCount || 0,
			minifiedCssCount: (data as any).minifiedCssCount || 0,
		},
		schema: {
			jsonLdBlocksCount: (data as any).jsonLdBlocksCount || 0,
			jsonLdItemsCount: (data as any).jsonLdItemsCount || 0,
			jsonLdTypes: (data as any).jsonLdTypes || [],
			schemaErrors: (data as any).schemaErrors || [],
			hasSchemaMarkup: (data as any).hasSchemaMarkup || false,
			hasBreadcrumbSchema: (data as any).hasBreadcrumbSchema || false,
			hasBreadcrumbLinks: (data as any).hasBreadcrumbLinks || false,
		},
		canonical: data.canonical,
		robotsMeta: data.robotsMeta,
		redirectCount: data.redirectCount,
		redirectUrls: data.redirectUrls,
		language: data.language,
		favicon: data.favicon,
	};

	// SSL / HTTPS
	if (!sslDetails.isHttps) {
		sections.technical.issues.push({
			message: 'Page is not served over HTTPS (SSL)',
			severity: 'high',
			fix: 'Enable SSL and ensure the page is accessible over https:// without redirecting to http://.',
		});
	} else if (sslDetails.requestedProtocol === 'http' && sslDetails.finalProtocol === 'https') {
		sections.technical.issues.push({
			message: 'HTTP redirects to HTTPS (recommended: use HTTPS links directly)',
			severity: 'low',
			fix: 'Update internal links and canonical URLs to use https:// directly to reduce redirect hops.',
		});
	}

	// URL Structure
	if (urlStructureDetails.hasUppercase) {
		sections.technical.issues.push({
			message: 'URL path contains uppercase characters',
			severity: 'medium',
			fix: 'Use clean, lowercase URLs for consistency and readability (e.g., /my-page instead of /My-Page).',
		});
	}

	if (urlStructureDetails.hasUnderscore) {
		sections.technical.issues.push({
			message: 'URL path contains underscores',
			severity: 'medium',
			fix: 'Use hyphens instead of underscores in URLs (e.g., /my-page instead of /my_page).',
		});
	}

	if (urlStructureDetails.hasDisallowedQueryParams) {
		sections.technical.issues.push({
			message: 'URL contains dynamic query parameters',
			severity: 'medium',
			fix: 'Avoid dynamic parameters in indexable URLs. Keep URLs short and readable; use canonical URLs if parameters are required.',
			currentValue: urlStructureDetails.disallowedParams.join(', '),
		});
	}

	if (urlStructureDetails.isPathTooLong) {
		sections.technical.issues.push({
			message: 'URL path is very long',
			severity: 'low',
			fix: 'Keep URLs short and readable where possible.',
			currentValue: String(urlStructureDetails.pathLength),
		});
	}

	// Inline CSS/JS + Minification + Schema (warnings + small bonuses)
	const inlineScriptsBytes = (data as any).inlineScriptsBytes || 0;
	const largestInlineScriptBytes = (data as any).largestInlineScriptBytes || 0;
	const inlineStylesBytes = (data as any).inlineStylesBytes || 0;
	const largestInlineStyleBytes = (data as any).largestInlineStyleBytes || 0;

	const isHeavyInline =
		largestInlineScriptBytes > 10_000 ||
		inlineScriptsBytes > 30_000 ||
		largestInlineStyleBytes > 5_000 ||
		inlineStylesBytes > 15_000;

	if (isHeavyInline) {
		sections.technical.issues.push({
			message: 'Heavy inline CSS/JS detected',
			severity: 'medium',
			fix: 'Move large inline <script>/<style> blocks into external files to improve caching.',
		});
	}

	const totalJsCount = (data as any).totalJsCount || 0;
	const minifiedJsCount = (data as any).minifiedJsCount || 0;
	const totalCssCount = (data as any).totalCssCount || 0;
	const minifiedCssCount = (data as any).minifiedCssCount || 0;

	const jsMinRatio = totalJsCount > 0 ? minifiedJsCount / totalJsCount : 1;
	const cssMinRatio = totalCssCount > 0 ? minifiedCssCount / totalCssCount : 1;
	const hasGoodMinification = jsMinRatio >= 0.5 && cssMinRatio >= 0.5;

	if (!hasGoodMinification && (totalJsCount > 0 || totalCssCount > 0)) {
		sections.technical.issues.push({
			message: 'Assets are not consistently minified',
			severity: 'medium',
			fix: 'Serve minified and compressed CSS/JS (commonly .min.css/.min.js) in production builds.',
			currentValue: `JS ${minifiedJsCount}/${totalJsCount}, CSS ${minifiedCssCount}/${totalCssCount}`,
		});
	}

	const hasSchemaMarkup = Boolean((data as any).hasSchemaMarkup);
	const schemaErrors = ((data as any).schemaErrors || []) as Array<any>;
	const hasSchemaErrors = schemaErrors.length > 0;
	const hasBreadcrumbSchema = Boolean((data as any).hasBreadcrumbSchema);
	const hasBreadcrumbLinks = Boolean((data as any).hasBreadcrumbLinks);

	if (!hasSchemaMarkup) {
		sections.technical.issues.push({
			message: 'No Schema Markup (JSON-LD) detected',
			severity: 'low',
			fix: 'Add JSON-LD schema (e.g., Product, Article, Organization) to enable rich snippets.',
		});
	}

	if (hasSchemaErrors) {
		sections.technical.issues.push({
			message: 'Schema Markup contains errors',
			severity: 'high',
			fix: 'Fix JSON-LD syntax/structure and re-validate using Schema Markup Validator (schema.org).',
			currentValue: String(schemaErrors.length),
		});
	}

	if (!hasBreadcrumbSchema && !hasBreadcrumbLinks) {
		sections.technical.issues.push({
			message: 'No breadcrumbs detected',
			severity: 'low',
			fix: 'Add breadcrumb navigation and/or BreadcrumbList schema to improve UX and crawling.',
		});
	}

	let technicalBonus = 0;
	if (!hasSchemaErrors) {
		if (hasSchemaMarkup) technicalBonus += 3;
		if (hasBreadcrumbSchema || hasBreadcrumbLinks) technicalBonus += 2;
	}
	if (hasGoodMinification) technicalBonus += 2;
	if (!isHeavyInline) technicalBonus += 1;
	sections.technical.bonusPoints = technicalBonus;

	if (!data.language) {
		sections.technical.issues.push({
			message: 'Missing language attribute',
			severity: 'medium',
			fix: 'Add a lang attribute to your <html> tag, e.g., <html lang="en">.',
		});
	}

	if (!data.favicon) {
		sections.technical.issues.push({
			message: 'Missing favicon',
			severity: 'medium',
			fix: 'Ensure a favicon.ico or manifest file is linked using <link rel="icon"> in the <head>.',
		});
	}

	// --- 5. Performance Audit ---
	sections.performance.details = {
		performanceMetrics: data.performanceMetrics,
		scripts: data.scripts,
		stylesheets: data.stylesheets,
	};

	// --- 6. Content Audit ---
	sections.content.details = {
		wordCount: data.wordCount,
	};

	// --- 7. Links Audit ---
	const allLinks = data.links || [];
	const internalLinks = allLinks.filter(l => l.isInternal);
	const externalLinks = allLinks.filter(l => !l.isInternal);
	const brokenLinks = internalLinks.filter(l => l.isBroken);
	const NON_DESCRIPTIVE = ['click here', 'here', 'read more', 'more', 'learn more', 'this', 'link', 'page', 'website', 'site', 'url'];
	const nonDescriptiveLinks = internalLinks.filter(l => {
		const t = l.text.toLowerCase().trim();
		return !t || NON_DESCRIPTIVE.includes(t);
	});
	const externalNoNofollow = externalLinks.filter(l => {
		const rel = (l.rel || '').toLowerCase();
		return !rel.includes('nofollow');
	});

	sections.links.details = {
		internalLinkCount: data.internalLinkCount,
		externalLinkCount: data.externalLinkCount,
		allLinks,
		internalLinks,
		externalLinks,
		brokenLinks,
		nonDescriptiveLinks,
		externalNoNofollow,
	};

	if (brokenLinks.length > 0) {
		sections.links.issues.push({
			message: `${brokenLinks.length} broken internal link${brokenLinks.length > 1 ? 's' : ''} found (404)`,
			severity: 'high',
			fix: 'Fix or remove URLs that return 404 errors to avoid crawl waste and poor user experience.',
			currentValue: `${brokenLinks.length} links`,
		});
	}

	if (nonDescriptiveLinks.length > 0) {
		sections.links.issues.push({
			message: `${nonDescriptiveLinks.length} internal link${nonDescriptiveLinks.length > 1 ? 's' : ''} with non-descriptive anchor text`,
			severity: 'medium',
			fix: 'Replace generic anchor text like "click here" or "read more" with descriptive keyword-rich text.',
			currentValue: `${nonDescriptiveLinks.length} links`,
		});
	}

	if (externalNoNofollow.length > 0) {
		sections.links.issues.push({
			message: `${externalNoNofollow.length} external link${externalNoNofollow.length > 1 ? 's' : ''} missing rel="nofollow"`,
			severity: 'low',
			fix: 'Add rel="nofollow" to untrusted or paid external links to control PageRank flow.',
			currentValue: `${externalNoNofollow.length} links`,
		});
	}

	// Score Calculation
	Object.values(sections).forEach((section) => {
		const highIssues = section.issues.filter((i) => i.severity === 'high').length;
		const medIssues = section.issues.filter((i) => i.severity === 'medium').length;
		const lowIssues = section.issues.filter((i) => i.severity === 'low').length;

		const baseScore = Math.max(
			0,
			100 - highIssues * 20 - medIssues * 10 - lowIssues * 5
		);
		const bonus = section.bonusPoints || 0;
		section.score = Math.max(0, Math.min(100, baseScore + bonus));
	});

	const totalScore = Math.round(
		Object.values(sections).reduce((acc, s) => acc + s.score, 0) / Object.keys(sections).length
	);

	let grade: ISeoReport['grade'] = 'F';
	if (totalScore >= 90) grade = 'A';
	else if (totalScore >= 80) grade = 'B';
	else if (totalScore >= 70) grade = 'C';
	else if (totalScore >= 60) grade = 'D';

	return {
		totalScore,
		grade,
		sections,
	};
};
