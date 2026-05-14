import { generateSeoReport } from '../seoReportGenerator';
import type { ScrapedPageData } from '../../../../types';

function createBasePage(overrides: Partial<ScrapedPageData> = {}): ScrapedPageData {
  return {
    url: 'https://example.com/',
    requestedUrl: 'https://example.com/',
    finalUrl: 'https://example.com/',
    redirectUrls: [],
    redirectCount: 0,
    isError: false,
    title: 'Example Title',
    metaDescription: 'Example description',
    metaKeywords: null,
    canonical: null,
    robotsMeta: null,
    language: 'en',
    favicon: 'https://example.com/favicon.ico',
    openGraph: { title: null, description: null, image: null },
    twitterCard: { card: null, title: null, description: null, image: null },
    inlineScriptsCount: 0,
    inlineScriptsBytes: 0,
    largestInlineScriptBytes: 0,
    inlineStylesCount: 0,
    inlineStylesBytes: 0,
    largestInlineStyleBytes: 0,
    totalJsCount: 0,
    minifiedJsCount: 0,
    totalCssCount: 0,
    minifiedCssCount: 0,
    jsonLdBlocksCount: 0,
    jsonLdItemsCount: 0,
    jsonLdTypes: [],
    schemaErrors: [],
    hasSchemaMarkup: false,
    hasBreadcrumbSchema: false,
    hasBreadcrumbLinks: false,
    headings: { h1: ['H1'], h2: [], h3: [], h4: [], h5: [], h6: [] },
    images: [],
    links: [],
    socialLinks: [],
    paragraphExcerpt: [],
    textSample: 'sample text',
    emails: [],
    phoneNumbers: [],
    wordCount: 10,
    internalLinkCount: 0,
    externalLinkCount: 0,
    performanceMetrics: null,
    scripts: [],
    stylesheets: [],
    ...overrides,
  };
}

describe('generateSeoReport - Social Preview tags', () => {
  test('adds meta issues and reduces meta score when OG/Twitter tags are missing', () => {
    const page = createBasePage();
    const report = generateSeoReport(page);

    const metaIssues = report.sections.meta.issues.map((i) => i.message);

    expect(metaIssues).toEqual(
      expect.arrayContaining([
        'Missing Open Graph title (og:title)',
        'Missing Open Graph description (og:description)',
        'Missing Open Graph image (og:image)',
        'Missing Twitter Card type (twitter:card)',
        'Missing Twitter title (twitter:title)',
        'Missing Twitter description (twitter:description)',
        'Missing Twitter image (twitter:image)',
      ])
    );

    // 3 high + 4 medium => 100 - 60 - 40 = 0
    expect(report.sections.meta.score).toBe(0);
  });

  test('does not add social meta issues when OG/Twitter tags are present', () => {
    const page = createBasePage({
      openGraph: {
        title: 'OG Title',
        description: 'OG Description',
        image: 'https://example.com/og.png',
      },
      twitterCard: {
        card: 'summary_large_image',
        title: 'Twitter Title',
        description: 'Twitter Description',
        image: 'https://example.com/tw.png',
      },
    });

    const report = generateSeoReport(page);
    const metaMessages = report.sections.meta.issues.map((i) => i.message);

    expect(metaMessages).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining('Open Graph'),
        expect.stringContaining('Twitter'),
      ])
    );

    expect(report.sections.meta.score).toBe(100);
  });
});

describe('generateSeoReport - URL Structure & HTTPS', () => {
  test('adds high issue when finalUrl is not HTTPS', () => {
    const page = createBasePage({
      requestedUrl: 'https://example.com/',
      finalUrl: 'http://example.com/',
    });

    const report = generateSeoReport(page);
    const technicalMessages = report.sections.technical.issues.map((i) => i.message);

    expect(technicalMessages).toEqual(
      expect.arrayContaining(['Page is not served over HTTPS (SSL)'])
    );
  });

  test('adds URL structure issues for uppercase, underscores, and disallowed params', () => {
    const page = createBasePage({
      finalUrl: 'https://example.com/My_Page?ref=123&utm_source=test',
    });

    const report = generateSeoReport(page);
    const technicalMessages = report.sections.technical.issues.map((i) => i.message);

    expect(technicalMessages).toEqual(
      expect.arrayContaining([
        'URL path contains uppercase characters',
        'URL path contains underscores',
        'URL contains dynamic query parameters',
      ])
    );
  });
});
