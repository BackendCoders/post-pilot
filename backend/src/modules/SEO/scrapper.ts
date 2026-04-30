import axios, { type AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import xml2js from 'xml2js';

type CategorizedUrls = Record<string, string[]>;

interface PageHeadingMap {
  h1: string[];
  h2: string[];
  h3: string[];
  h4: string[];
  h5: string[];
  h6: string[];
}

interface SiteScrapeResult {
  requestedUrl: string;
  analyzedDomain: string;
  robotsTxt: string;
  sitemapUrls: string[];
  categorizedUrls: CategorizedUrls;
  totalPagesDiscovered: number;
  pageDetails: ScrapedPageData[];
}

interface PerformanceMetrics {
  desktop: {
    ttfb: number;
    dns: number;
    tcp: number;
    firstByte: number;
    contentDownload: number;
    totalLoadTime: number;
  };
  mobile: {
    ttfb: number;
    dns: number;
    tcp: number;
    firstByte: number;
    contentDownload: number;
    totalLoadTime: number;
  };
  pageSize: number;
  pageSizeFormatted: string;
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
  fcpRating: 'good' | 'needs-improvement' | 'poor' | null;
  lcpRating: 'good' | 'needs-improvement' | 'poor' | null;
  fidRating: 'good' | 'needs-improvement' | 'poor' | null;
  clsRating: 'good' | 'needs-improvement' | 'poor' | null;
  inpRating: 'good' | 'needs-improvement' | 'poor' | null;
  tbtRating: 'good' | 'needs-improvement' | 'poor' | null;
  overallPerformanceScore: number | null;
}

interface ScrapedPageData {
  url: string;
  redirectUrls: string[];
  redirectCount: number;
  isError: boolean;
  title: string;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  };
  images: {
    src: string;
    alt: string;
    size: number;
    type: string;
    isBroken?: boolean;
  }[];
  links: string[];
  socialLinks: string[];
  paragraphExcerpt: string[];
  textSample: string;
  emails: string[];
  phoneNumbers: string[];
  wordCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
  performanceMetrics: PerformanceMetrics | null;
  scripts: {
    src: string;
    size: number;
    isAsync: boolean;
    isDefer: boolean;
    isExternal: boolean;
  }[];
  stylesheets: {
    href: string;
    size: number;
    isExternal: boolean;
  }[];
}

interface SitePageCountResult {
  requestedUrl: string;
  analyzedDomain: string;
  robotsTxt: string;
  sitemapUrls: string[];
  totalPages: number;
  categorizedUrls: CategorizedUrls;
  urls: string[];
}

interface AnalyzeInput {
  url: string;
  mode?: 'auto' | 'page' | 'site';
  fullSite?: boolean;
}

interface AnalyzeResult {
  mode: 'page' | 'site';
  requestedUrl: string;
  normalizedUrl: string;
  data: ScrapedPageData | SiteScrapeResult;
}

type PageImage = {
  src: string;
  alt: string;
  size: number;
  type: string;
  isBroken: boolean;
};

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  return {
    message: 'Unknown error',
    error,
  };
}

function createHttpError(message: string, statusCode: number) {
  const error = new Error(message) as Error & {
    statusCode?: number;
    isOperational?: boolean;
  };

  error.statusCode = statusCode;
  error.isOperational = true;

  return error;
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    throw createHttpError('URL is required', 400);
  }

  const urlWithProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(urlWithProtocol).toString();
  } catch {
    throw createHttpError('Invalid URL provided', 400);
  }
}

function getDomain(url: string): string {
  return new URL(url).origin;
}

async function getRobots(domain: string): Promise<string | null> {
  try {
    const robotsUrl = `${domain}/robots.txt`;
    const res = await axios.get(robotsUrl, {
      timeout: 15000,
      validateStatus: (status) => status < 500,
    });

    if (res.status >= 400) {
      return null;
    }

    return typeof res.data === 'string' ? res.data : String(res.data ?? '');
  } catch (error) {
    console.error('Failed to fetch robots.txt', {
      domain,
      robotsUrl: `${domain}/robots.txt`,
      ...getErrorDetails(error),
    });
    return null;
  }
}

function extractSitemaps(robotsText: string): string[] {
  const lines = robotsText.split('\n');
  const sitemaps: string[] = [];

  for (const line of lines) {
    if (line.toLowerCase().startsWith('sitemap:')) {
      const sitemapUrl = line.slice('sitemap:'.length).trim();

      if (sitemapUrl) {
        sitemaps.push(sitemapUrl);
      }
    }
  }

  return Array.from(new Set(sitemaps));
}

function categorizeFallback(url: string): string {
  if (url.includes('/blog/')) return 'blog';
  if (url.includes('/product/')) return 'product';
  if (url.includes('/pages/')) return 'pages';
  if (url.includes('/posts/') || url.includes('/post/')) return 'post';
  if (url.includes('/category/')) return 'category';

  return 'other';
}

async function fetchPageSpeedMetrics(url: string, strategy: 'mobile' | 'desktop'): Promise<any> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;

  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}&category=performance`;
    const res = await axios.get(apiUrl, { timeout: 30000 });
    const audit = res.data?.lighthouseResult;
    if (!audit) return null;

    const metrics = audit.audits;
    console.log(metrics);
    return {
      score: audit.categories.performance.score * 100,
      fcp: metrics['first-contentful-paint']?.numericValue || null,
      lcp: metrics['largest-contentful-paint']?.numericValue || null,
      cls: metrics['cumulative-layout-shift']?.numericValue || null,
      tbt: metrics['total-blocking-time']?.numericValue || null,
      speedIndex: metrics['speed-index']?.numericValue || null,
      ttfb: metrics['server-response-time']?.numericValue || null,
      totalLoadTime: metrics['speed-index']?.numericValue || metrics['interactive']?.numericValue?.numericValue || null,
    };
  } catch (error) {
    console.error(`PageSpeed API failed for ${strategy}:`, getErrorDetails(error));
    return null;
  }
}

async function fetchXml(url: string) {
  const response = await axios.get(url, {
    timeout: 20000,
    responseType: 'text',
  });

  return xml2js.parseStringPromise(response.data);
}

async function collectUrlsFromSitemap(
  url: string,
  visited = new Set<string>()
): Promise<CategorizedUrls> {
  const result: CategorizedUrls = {};
  if (visited.has(url)) {
    return result;
  }

  visited.add(url);

  try {
    const parsed = await fetchXml(url);

    if (parsed.urlset?.url) {
      // Try to get category from sitemap filename or last part of URL
      let categoryName = 'other';
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop() || '';
        if (filename.includes('sitemap')) {
          // e.g. product-sitemap.xml -> product
          const match = filename.match(/([a-zA-Z0-9_-]+)-sitemap/i);
          if (match && match[1]) {
            categoryName = match[1];
          } else {
            // maybe sitemap-product.xml
            const match2 = filename.match(/sitemap-([a-zA-Z0-9_-]+)/i);
            if (match2 && match2[1]) {
              categoryName = match2[1];
            }
          }
        }
      } catch (e) {
        console.warn('Failed to extract category name from sitemap URL', url);
      }

      const urls = parsed.urlset.url
        .map((item: { loc?: string[] }) => item.loc?.[0])
        .filter((value: string | undefined): value is string => Boolean(value));

      if (urls.length > 0) {
        // If we couldn't find a good category name from the URL, try fallback categorization for individual URLs
        if (categoryName === 'other') {
          for (const pageUrl of urls) {
            const cat = categorizeFallback(pageUrl);
            if (!result[cat]) result[cat] = [];
            result[cat].push(pageUrl);
          }
        } else {
          result[categoryName] = urls;
        }
      }
      return result;
    }

    if (parsed.sitemapindex?.sitemap) {
      const nestedSitemaps = parsed.sitemapindex.sitemap
        .map((item: { loc?: string[] }) => item.loc?.[0])
        .filter((value: string | undefined): value is string => Boolean(value));

      const nestedResults = await Promise.all(
        nestedSitemaps.map((sitemapUrl: string) =>
          collectUrlsFromSitemap(sitemapUrl, visited)
        )
      );

      // Merge nested results
      for (const nested of nestedResults) {
        for (const [cat, urls] of Object.entries(nested)) {
          if (!result[cat]) result[cat] = [];
          if (Array.isArray(urls)) {
            result[cat].push(...urls);
          }
        }
      }
      return result;
    }

    return result;
  } catch (error) {
    console.error('Failed to parse sitemap', {
      sitemapUrl: url,
      ...getErrorDetails(error),
    });
    return result;
  }
}

function getTextList($: cheerio.CheerioAPI, selector: string): string[] {
  const values: string[] = [];

  $(selector).each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();

    if (text) {
      values.push(text);
    }
  });

  return values;
}

async function scrapImages(
  $: cheerio.CheerioAPI,
  baseUrl: string
): Promise<PageImage[]> {
  const imgElements = $('img').toArray();

  const imagePromises = imgElements.map(async (el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || '';

    if (!src) {
      return { src: '', alt: '', size: 0, type: 'N/A', isBroken: true };
    }

    const fullUrl = resolveUrl(baseUrl, src);

    try {
      // Try HEAD first
      const res = await axios.head(fullUrl, { timeout: 3000 });
      const size = res.headers['content-length']
        ? parseInt(res.headers['content-length'], 10)
        : 0;
      const type = res.headers['content-type'] || 'image/unknown';

      return {
        src: fullUrl,
        alt,
        size,
        type,
        isBroken: false,
      };
    } catch (err) {
      // Fallback to GET stream if HEAD fails
      try {
        const res = await axios.get(fullUrl, {
          responseType: 'stream',
          timeout: 5000,
        });

        const size = res.headers['content-length']
          ? parseInt(res.headers['content-length'], 10)
          : 0;
        const type = res.headers['content-type'] || 'N/A';

        return {
          src: fullUrl,
          alt,
          size,
          type,
          isBroken: false,
        };
      } catch {
        return {
          src: fullUrl,
          alt,
          size: 0,
          type: 'N/A',
          isBroken: true,
        };
      }
    }
  });

  return Promise.all(imagePromises);
}

function scrapHeaderText($: cheerio.CheerioAPI): PageHeadingMap {
  return {
    h1: getTextList($, 'h1'),
    h2: getTextList($, 'h2'),
    h3: getTextList($, 'h3'),
    h4: getTextList($, 'h4'),
    h5: getTextList($, 'h5'),
    h6: getTextList($, 'h6'),
  };
}

function resolveUrl(baseUrl: string, href: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

function scrapLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const links: string[] = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');

    if (href) {
      links.push(resolveUrl(baseUrl, href));
    }
  });

  return Array.from(new Set(links));
}

function scrapSocialLinks(links: string[]) {
  return links.filter(
    (link) =>
      link.includes('facebook') ||
      link.includes('instagram') ||
      link.includes('twitter') ||
      link.includes('linkedin') ||
      link.includes('youtube') ||
      link.includes('tiktok') ||
      link.includes('pinterest') ||
      link.includes('snapchat') ||
      link.includes('whatsapp') ||
      link.includes('reddit')
  );
}

function extractParagraphExcerpt($: cheerio.CheerioAPI): string[] {
  return getTextList($, 'p').slice(0, 10);
}

async function scrapScripts(
  $: cheerio.CheerioAPI,
  baseUrl: string
): Promise<ScrapedPageData['scripts']> {
  const scriptElements = $('script[src]').toArray();

  const scriptPromises = scriptElements.map(async (el) => {
    const src = $(el).attr('src');
    if (!src) return null;

    const fullUrl = resolveUrl(baseUrl, src);
    const isAsync = $(el).attr('async') !== undefined;
    const isDefer = $(el).attr('defer') !== undefined;
    const isExternal = !fullUrl.includes(new URL(baseUrl).host);

    try {
      const res = await axios.head(fullUrl, { timeout: 3000 });
      const size = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : 0;
      return { src: fullUrl, size, isAsync, isDefer, isExternal };
    } catch {
      return { src: fullUrl, size: 0, isAsync, isDefer, isExternal };
    }
  });

  const results = await Promise.all(scriptPromises);
  return results.filter((s): s is NonNullable<typeof s> => s !== null);
}

async function scrapStylesheets(
  $: cheerio.CheerioAPI,
  baseUrl: string
): Promise<ScrapedPageData['stylesheets']> {
  const linkElements = $('link[rel="stylesheet"]').toArray();

  const stylePromises = linkElements.map(async (el) => {
    const href = $(el).attr('href');
    if (!href) return null;

    const fullUrl = resolveUrl(baseUrl, href);
    const isExternal = !fullUrl.includes(new URL(baseUrl).host);

    try {
      const res = await axios.head(fullUrl, { timeout: 3000 });
      const size = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : 0;
      return { href: fullUrl, size, isExternal };
    } catch {
      return { href: fullUrl, size: 0, isExternal };
    }
  });

  const results = await Promise.all(stylePromises);
  return results.filter((s): s is NonNullable<typeof s> => s !== null);
}

function extractWordCount(text: string): number {
  const trimmed = text.trim();

  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

function countPhoneNumbers(text: string) {
  // Matches international + local phone formats
  const phoneRegex =
    /(\+?\d{1,3}[\s.-]?)?(\(?\d{2,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{4,}/g;

  const matches = text.match(phoneRegex) || [];

  // Remove duplicates
  const uniquePhones = [...new Set(matches.map((num) => num.trim()))];

  return {
    total: uniquePhones.length,
    numbers: uniquePhones,
  };
}

// Function to extract all emails
function extractEmails(text: string) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  const matches = text.match(emailRegex) || [];

  // Remove duplicates
  return [...new Set(matches)];
}

async function scrapeWebPage(url: string): Promise<ScrapedPageData> {
  try {
    const normalizedUrl = normalizeUrl(url);
    const startTime = Date.now();

    const response = await axios.get(normalizedUrl, {
      timeout: 20000,
      responseType: 'text',
      maxRedirects: 10,
    });

    const endTime = Date.now();
    const totalLoadTime = endTime - startTime;
    const redirectUrls = response.request._redirectable._redirects || [];
    const redirectCount = redirectUrls.length;

    const data = response.data;
    const $ = cheerio.load(data);
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();

    const title = $('title').text().trim();
    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() || null;
    const metaKeywords =
      $('meta[name="keywords"]').attr('content')?.trim() || null;
    const canonical = $('link[rel="canonical"]').attr('href')
      ? resolveUrl(normalizedUrl, $('link[rel="canonical"]').attr('href')!)
      : null;
    const robotsMeta = $('meta[name="robots"]').attr('content')?.trim() || null;
    const headings = scrapHeaderText($);
    const [images, scripts, stylesheets] = await Promise.all([
      scrapImages($, normalizedUrl),
      scrapScripts($, normalizedUrl),
      scrapStylesheets($, normalizedUrl),
    ]);
    const links = scrapLinks($, normalizedUrl);
    const socialLinks = scrapSocialLinks(links);
    const pageOrigin = getDomain(normalizedUrl);
    const internalLinkCount = links.filter((link) =>
      link.startsWith(pageOrigin)
    ).length;
    const externalLinkCount = links.length - internalLinkCount;
    const paragraphExcerpt = extractParagraphExcerpt($);
    const emails = extractEmails(textContent);
    const phoneNumber = countPhoneNumbers(textContent);

    const pageSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
    const pageSizeFormatted = formatBytes(pageSize);

    // Fetch real Google PageSpeed metrics if API Key is provided
    const [googleMobile, googleDesktop] = await Promise.all([
      fetchPageSpeedMetrics(normalizedUrl, 'mobile'),
      fetchPageSpeedMetrics(normalizedUrl, 'desktop'),
    ]);

    const mobileTotalLoadTime = googleMobile?.totalLoadTime || Math.round(totalLoadTime * 2.5);

    const performanceMetrics: PerformanceMetrics = {
      desktop: {
        ttfb: googleDesktop?.ttfb || Math.round(totalLoadTime * 0.3),
        dns: Math.round(totalLoadTime * 0.1),
        tcp: Math.round(totalLoadTime * 0.15),
        firstByte: Math.round(totalLoadTime * 0.25),
        contentDownload: Math.round(totalLoadTime * 0.5),
        totalLoadTime: googleDesktop?.totalLoadTime || totalLoadTime,
      },
      mobile: {
        ttfb: googleMobile?.ttfb || Math.round(mobileTotalLoadTime * 0.3),
        dns: Math.round(mobileTotalLoadTime * 0.1),
        tcp: Math.round(mobileTotalLoadTime * 0.15),
        firstByte: Math.round(mobileTotalLoadTime * 0.25),
        contentDownload: Math.round(mobileTotalLoadTime * 0.5),
        totalLoadTime: mobileTotalLoadTime,
      },
      pageSize,
      pageSizeFormatted,
      fcp: googleMobile?.fcp || null,
      lcp: googleMobile?.lcp || null,
      fid: null,
      cls: googleMobile?.cls || null,
      inp: null,
      tbt: googleMobile?.tbt || null,
      fcpRating: googleMobile?.fcp ? (googleMobile.fcp < 1800 ? 'good' : googleMobile.fcp < 3000 ? 'needs-improvement' : 'poor') : null,
      lcpRating: googleMobile?.lcp ? (googleMobile.lcp < 2500 ? 'good' : googleMobile.lcp < 4000 ? 'needs-improvement' : 'poor') : null,
      fidRating: null,
      clsRating: (googleMobile && googleMobile.cls !== null && googleMobile.cls !== undefined) ? (googleMobile.cls < 0.1 ? 'good' : googleMobile.cls < 0.25 ? 'needs-improvement' : 'poor') : null,
      inpRating: null,
      tbtRating: googleMobile?.tbt ? (googleMobile.tbt < 200 ? 'good' : googleMobile.tbt < 600 ? 'needs-improvement' : 'poor') : null,
      overallPerformanceScore: googleMobile?.score || null,
    };

    return {
      url: normalizedUrl,
      redirectUrls,
      redirectCount,
      isError: false,
      title,
      metaDescription,
      metaKeywords,
      canonical,
      robotsMeta,
      headings,
      images,
      links,
      socialLinks,
      paragraphExcerpt,
      textSample: textContent.slice(0, 1500),
      wordCount: extractWordCount(textContent),
      internalLinkCount,
      externalLinkCount,
      emails,
      phoneNumbers: phoneNumber.numbers,
      performanceMetrics,
      scripts,
      stylesheets,
    };
  } catch (error: any) {
    console.error('Web page scrape failed', {
      url,
      ...getErrorDetails(error),
    });
    throw createHttpError('Failed to scrape the requested web page', 502);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function crawlSite(domainOrUrl: string): Promise<SiteScrapeResult> {
  const normalizedUrl = normalizeUrl(domainOrUrl);
  const analyzedDomain = getDomain(normalizedUrl);
  const categorized: CategorizedUrls = {};

  const robots = await getRobots(analyzedDomain);

  if (!robots) {
    throw createHttpError(
      'robots.txt not found. Full-site scraping is not allowed for this domain.',
      422
    );
  }

  const sitemapUrls = extractSitemaps(robots);

  if (sitemapUrls.length === 0) {
    throw createHttpError(
      'No sitemap entries were found in robots.txt. Full-site scraping was not performed.',
      422
    );
  }

  for (const sitemapUrl of sitemapUrls) {
    const sitemapCategorized = await collectUrlsFromSitemap(sitemapUrl);

    for (const [cat, urls] of Object.entries(sitemapCategorized)) {
      if (!categorized[cat]) categorized[cat] = [];
      // Filter by domain
      const filtered = urls.filter(u => u.startsWith(analyzedDomain));
      categorized[cat].push(...filtered);
    }
  }

  // Deduplicate and sort
  const discoveredUrls = new Set<string>();
  for (const cat in categorized) {
    categorized[cat] = Array.from(new Set(categorized[cat])).sort();
    categorized[cat].forEach(u => discoveredUrls.add(u));
  }

  const sortedUrls = Array.from(discoveredUrls).sort();

  const pageDetails: ScrapedPageData[] = [];

  for (const pageUrl of sortedUrls) {
    try {
      const pageData = await scrapeWebPage(pageUrl);
      pageDetails.push(pageData);
    } catch (error) {
      console.error('Failed to scrape page during full-site analysis', {
        pageUrl,
        analyzedDomain,
        ...getErrorDetails(error),
      });
    }
  }

  return {
    requestedUrl: normalizedUrl,
    analyzedDomain,
    robotsTxt: robots,
    sitemapUrls,
    categorizedUrls: categorized,
    totalPagesDiscovered: sortedUrls.length,
    pageDetails,
  };
}

async function countSitePages(
  domainOrUrl: string
): Promise<SitePageCountResult> {
  const normalizedUrl = normalizeUrl(domainOrUrl);
  const analyzedDomain = getDomain(normalizedUrl);
  const categorized: CategorizedUrls = {};

  const robots = await getRobots(analyzedDomain);

  if (!robots) {
    throw createHttpError(
      'robots.txt not found. Page counting is not allowed for this domain.',
      422
    );
  }

  const sitemapUrls = extractSitemaps(robots);

  if (sitemapUrls.length === 0) {
    throw createHttpError(
      'No sitemap entries were found in robots.txt. Page counting was not performed.',
      422
    );
  }

  for (const sitemapUrl of sitemapUrls) {
    const sitemapCategorized = await collectUrlsFromSitemap(sitemapUrl);

    for (const [cat, urls] of Object.entries(sitemapCategorized)) {
      if (!categorized[cat]) categorized[cat] = [];
      const filtered = urls.filter(u => u.startsWith(analyzedDomain));
      categorized[cat].push(...filtered);
    }
  }

  const allUrls = new Set<string>();
  for (const cat in categorized) {
    categorized[cat] = Array.from(new Set(categorized[cat])).sort();
    categorized[cat].forEach(u => allUrls.add(u));
  }

  const urls = Array.from(allUrls).sort();

  return {
    requestedUrl: normalizedUrl,
    analyzedDomain,
    robotsTxt: robots,
    sitemapUrls,
    totalPages: urls.length,
    categorizedUrls: categorized,
    urls,
  };
}

function createErrorPageData(url: string): ScrapedPageData {
  return {
    url,
    redirectUrls: [],
    redirectCount: 0,
    isError: true,
    title: '',
    metaDescription: null,
    metaKeywords: null,
    canonical: null,
    robotsMeta: null,
    headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
    images: [],
    links: [],
    socialLinks: [],
    paragraphExcerpt: [],
    textSample: '',
    emails: [],
    phoneNumbers: [],
    wordCount: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
    performanceMetrics: null,
    scripts: [],
    stylesheets: [],
  };
}

async function scrapeMultipleWebPages(
  urls: string[],
  concurrency: number = 5
): Promise<ScrapedPageData[]> {
  const results: ScrapedPageData[] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          return await scrapeWebPage(url);
        } catch (error) {
          console.error('Bulk page scrape failed for URL', {
            url,
            ...getErrorDetails(error),
          });
          return createErrorPageData(url);
        }
      })
    );
    results.push(...batchResults);
  }

  return results;
}

function resolveMode({
  normalizedUrl,
  mode,
  fullSite,
}: {
  normalizedUrl: string;
  mode?: 'auto' | 'page' | 'site';
  fullSite?: boolean;
}): 'page' | 'site' {
  if (fullSite) {
    return 'site';
  }

  if (mode === 'page' || mode === 'site') {
    return mode;
  }

  const parsed = new URL(normalizedUrl);
  const isHomePage = parsed.pathname === '/' || parsed.pathname === '';

  return isHomePage ? 'site' : 'page';
}

async function analyzeUrl(input: AnalyzeInput): Promise<AnalyzeResult> {
  const normalizedUrl = normalizeUrl(input.url);
  const resolvedMode = resolveMode({
    normalizedUrl,
    mode: input.mode,
    fullSite: input.fullSite,
  });

  if (resolvedMode === 'site') {
    const siteData = await crawlSite(normalizedUrl);

    return {
      mode: 'site',
      requestedUrl: input.url,
      normalizedUrl,
      data: siteData,
    };
  }

  const pageData = await scrapeWebPage(normalizedUrl);

  return {
    mode: 'page',
    requestedUrl: input.url,
    normalizedUrl,
    data: pageData,
  };
}

export type {
  AnalyzeInput,
  AnalyzeResult,
  CategorizedUrls,
  PageHeadingMap,
  PageImage,
  SitePageCountResult,
  SiteScrapeResult,
  PerformanceMetrics,
};

export {
  analyzeUrl,
  countSitePages,
  crawlSite,
  scrapeMultipleWebPages,
  scrapeWebPage,
};
