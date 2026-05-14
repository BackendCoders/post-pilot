import axios, { type AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import xml2js from 'xml2js';
import type {
  ScrapedPageData,
  IPerformanceMetrics as PerformanceMetrics,
  SiteScrapeResult,
  PageHeadingMap,
  PageLink
} from '../../types';

type CategorizedUrls = Record<string, string[]>;

const resourceCache = new Map<string, { size: number; type: string; lastChecked: number }>();
const CACHE_TTL = 3600000; // 1 hour

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
  loading: string | null;
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

function normalizeMetaContent(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getMetaContent(
  $: cheerio.CheerioAPI,
  selectors: string[]
): string | null {
  for (const selector of selectors) {
    const content = $(selector).attr('content');
    const normalized = normalizeMetaContent(content);
    if (normalized) return normalized;
  }
  return null;
}

function getFinalResponseUrl(response: any, fallbackUrl: string): string {
  const candidate =
    response?.request?.res?.responseUrl ||
    response?.request?._redirectable?._currentUrl ||
    response?.config?.url ||
    fallbackUrl;

  return typeof candidate === 'string' && candidate.trim()
    ? candidate.trim()
    : fallbackUrl;
}

function isProbablyMinifiedAssetUrl(url: string, kind: 'js' | 'css'): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    return kind === 'js'
      ? pathname.endsWith('.min.js')
      : pathname.endsWith('.min.css');
  } catch {
    const lower = url.toLowerCase();
    return kind === 'js' ? lower.endsWith('.min.js') : lower.endsWith('.min.css');
  }
}

function extractInlineBlockMetrics($: cheerio.CheerioAPI) {
  let inlineScriptsCount = 0;
  let inlineScriptsBytes = 0;
  let largestInlineScriptBytes = 0;

  $('script:not([src])').each((_, el) => {
    const content = $(el).text() || '';
    const bytes = Buffer.byteLength(content, 'utf8');
    inlineScriptsCount += 1;
    inlineScriptsBytes += bytes;
    if (bytes > largestInlineScriptBytes) largestInlineScriptBytes = bytes;
  });

  let inlineStylesCount = 0;
  let inlineStylesBytes = 0;
  let largestInlineStyleBytes = 0;

  $('style').each((_, el) => {
    const content = $(el).text() || '';
    const bytes = Buffer.byteLength(content, 'utf8');
    inlineStylesCount += 1;
    inlineStylesBytes += bytes;
    if (bytes > largestInlineStyleBytes) largestInlineStyleBytes = bytes;
  });

  return {
    inlineScriptsCount,
    inlineScriptsBytes,
    largestInlineScriptBytes,
    inlineStylesCount,
    inlineStylesBytes,
    largestInlineStyleBytes,
  };
}

function extractJsonLd($: cheerio.CheerioAPI) {
  const schemaErrors: Array<{ message: string; snippet?: string }> = [];
  const jsonLdTypes = new Set<string>();
  let jsonLdBlocksCount = 0;
  let jsonLdItemsCount = 0;

  const collectTypes = (node: any) => {
    if (!node || typeof node !== 'object') return;

    const t = (node as any)['@type'];
    if (typeof t === 'string') jsonLdTypes.add(t);
    else if (Array.isArray(t)) {
      t.forEach((x) => typeof x === 'string' && jsonLdTypes.add(x));
    }

    const graph = (node as any)['@graph'];
    if (Array.isArray(graph)) graph.forEach(collectTypes);
  };

  $('script[type="application/ld+json"]').each((_, el) => {
    jsonLdBlocksCount += 1;
    const raw = ($(el).text() || '').trim();

    if (!raw) {
      schemaErrors.push({ message: 'Empty JSON-LD block' });
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      const items: any[] = [];
      if (Array.isArray(parsed)) items.push(...parsed);
      else if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as any)['@graph'])
      ) {
        items.push(...((parsed as any)['@graph'] as any[]));
      } else {
        items.push(parsed);
      }

      jsonLdItemsCount += items.length;
      items.forEach(collectTypes);
    } catch (e: any) {
      schemaErrors.push({
        message: `Invalid JSON-LD: ${e?.message || 'JSON parse error'}`,
        snippet: raw.slice(0, 180),
      });
    }
  });

  const types = Array.from(jsonLdTypes);

  return {
    jsonLdBlocksCount,
    jsonLdItemsCount,
    jsonLdTypes: types,
    schemaErrors,
    hasSchemaMarkup: jsonLdItemsCount > 0,
    hasBreadcrumbSchema: types.includes('BreadcrumbList'),
  };
}

function detectBreadcrumbLinks($: cheerio.CheerioAPI): boolean {
  if ($('.breadcrumb').length > 0) return true;
  if ($('[itemtype*="BreadcrumbList"]').length > 0) return true;

  let found = false;
  $('nav[aria-label]').each((_, el) => {
    const label = ($(el).attr('aria-label') || '').toLowerCase();
    if (label.includes('breadcrumb')) found = true;
  });

  return found;
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
    const res = await axios.get(apiUrl, { timeout: 300000 });
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
    const loading = $(el).attr('loading') || null;

    if (!src) {
      return { src: '', alt: '', size: 0, type: 'N/A', isBroken: true, loading };
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
        loading,
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
          loading,
        };
      } catch {
        return {
          src: fullUrl,
          alt,
          size: 0,
          type: 'N/A',
          isBroken: true,
          loading,
        };
      }
    }
  });

  return Promise.all(imagePromises);
}

async function pool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: Promise<R>[] = [];
  const executing = new Set<Promise<R>>();

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    executing.add(p);

    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
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

async function scrapLinks($: cheerio.CheerioAPI, baseUrl: string): Promise<PageLink[]> {
  const pageOrigin = getDomain(baseUrl);
  const seen = new Set<string>();
  const linkPromises: Promise<PageLink>[] = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') return;

    const resolvedHref = resolveUrl(baseUrl, href);
    if (seen.has(resolvedHref)) return;
    seen.add(resolvedHref);

    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const rel = $(el).attr('rel') || null;
    const isInternal = resolvedHref.startsWith(pageOrigin);

    linkPromises.push(
      (async (): Promise<PageLink> => {
        let isBroken = false;
        if (isInternal) {
          try {
            const res = await axios.head(resolvedHref, { timeout: 4000, maxRedirects: 5 });
            isBroken = res.status >= 400;
          } catch (e: any) {
            isBroken = e?.response?.status ? e.response.status >= 400 : false;
          }
        }
        return { href: resolvedHref, text, isInternal, rel, isBroken };
      })()
    );
  });

  const results = await Promise.all(linkPromises);
  return results;
}

function scrapSocialLinks(links: PageLink[]) {
  const socialDomains = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'snapchat', 'whatsapp', 'reddit'];
  return links
    .filter((link) => socialDomains.some((d) => link.href.includes(d)))
    .map((link) => link.href);
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
      const cached = resourceCache.get(fullUrl);
      if (cached && Date.now() - cached.lastChecked < CACHE_TTL) {
        return { src: fullUrl, size: cached.size, isAsync, isDefer, isExternal };
      }

      const res = await axios.head(fullUrl, { timeout: 3000 });
      const size = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : 0;

      resourceCache.set(fullUrl, {
        size,
        type: res.headers['content-type'] || 'application/javascript',
        lastChecked: Date.now()
      });

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
      const cached = resourceCache.get(fullUrl);
      if (cached && Date.now() - cached.lastChecked < CACHE_TTL) {
        return { href: fullUrl, size: cached.size, isExternal };
      }

      const res = await axios.head(fullUrl, { timeout: 3000 });
      const size = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : 0;

      resourceCache.set(fullUrl, {
        size,
        type: res.headers['content-type'] || 'text/css',
        lastChecked: Date.now()
      });

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

async function scrapeWebPage(
  url: string,
  options: {
    includePageSpeed?: boolean;
    onProgress?: (partial: Partial<ScrapedPageData>) => Promise<void>;
  } = { includePageSpeed: true }
): Promise<ScrapedPageData> {
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
    const finalUrl = getFinalResponseUrl(response, normalizedUrl);
    const redirectUrls = response.request._redirectable._redirects || [];
    const redirectCount = redirectUrls.length;

    const data = response.data;
    const $ = cheerio.load(data);
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();

    const inlineMetrics = extractInlineBlockMetrics($);
    const jsonLd = extractJsonLd($);
    const hasBreadcrumbLinks = detectBreadcrumbLinks($);

    const title = $('title').text().trim();
    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() || null;
    const metaKeywords =
      $('meta[name="keywords"]').attr('content')?.trim() || null;
    const canonical = $('link[rel="canonical"]').attr('href')
      ? resolveUrl(normalizedUrl, $('link[rel="canonical"]').attr('href')!)
      : null;
    const robotsMeta = $('meta[name="robots"]').attr('content')?.trim() || null;
    const language = $('html').attr('lang')?.trim() || null;
    const favicon = $('link[rel~="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || $('link[rel="manifest"]').attr('href') || null;

    const ogTitle = getMetaContent($, [
      'meta[property="og:title"]',
      'meta[name="og:title"]',
    ]);
    const ogDescription = getMetaContent($, [
      'meta[property="og:description"]',
      'meta[name="og:description"]',
    ]);
    const ogImageRaw =
      getMetaContent($, ['meta[property="og:image"]', 'meta[name="og:image"]']) ||
      getMetaContent($, [
        'meta[property="og:image:url"]',
        'meta[name="og:image:url"]',
      ]);
    const ogImage = ogImageRaw ? resolveUrl(normalizedUrl, ogImageRaw) : null;

    const twitterCard = getMetaContent($, [
      'meta[name="twitter:card"]',
      'meta[property="twitter:card"]',
    ]);
    const twitterTitle = getMetaContent($, [
      'meta[name="twitter:title"]',
      'meta[property="twitter:title"]',
    ]);
    const twitterDescription = getMetaContent($, [
      'meta[name="twitter:description"]',
      'meta[property="twitter:description"]',
    ]);
    const twitterImageRaw = getMetaContent($, [
      'meta[name="twitter:image"]',
      'meta[property="twitter:image"]',
    ]);
    const twitterImage = twitterImageRaw
      ? resolveUrl(normalizedUrl, twitterImageRaw)
      : null;
    const headings = scrapHeaderText($);

    // Initial data available
    const initialData: Partial<ScrapedPageData> = {
      url: normalizedUrl,
      requestedUrl: normalizedUrl,
      finalUrl,
      title,
      metaDescription,
      metaKeywords,
      canonical,
      robotsMeta,
      language,
      favicon,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        image: ogImage,
      },
      twitterCard: {
        card: twitterCard,
        title: twitterTitle,
        description: twitterDescription,
        image: twitterImage,
      },
      ...inlineMetrics,
      totalJsCount: 0,
      minifiedJsCount: 0,
      totalCssCount: 0,
      minifiedCssCount: 0,
      ...jsonLd,
      hasBreadcrumbLinks,
      headings,
      isError: false
    };
    if (options.onProgress) await options.onProgress(initialData);

    const [images, scripts, stylesheets] = await Promise.all([
      scrapImages($, normalizedUrl),
      scrapScripts($, normalizedUrl),
      scrapStylesheets($, normalizedUrl),
    ]);

    const totalJsCount = scripts.length;
    const minifiedJsCount = scripts.filter((s) =>
      isProbablyMinifiedAssetUrl(s.src, 'js')
    ).length;
    const totalCssCount = stylesheets.length;
    const minifiedCssCount = stylesheets.filter((s) =>
      isProbablyMinifiedAssetUrl(s.href, 'css')
    ).length;

    // Images and assets available
    if (options.onProgress) {
      await options.onProgress({
        ...initialData,
        images,
        scripts,
        stylesheets,
        totalJsCount,
        minifiedJsCount,
        totalCssCount,
        minifiedCssCount,
      });
    }

    const links = await scrapLinks($, normalizedUrl);
    const socialLinks = scrapSocialLinks(links);
    const pageOrigin = getDomain(normalizedUrl);
    const internalLinkCount = links.filter((link) => link.isInternal).length;
    const externalLinkCount = links.filter((link) => !link.isInternal).length;
    const paragraphExcerpt = extractParagraphExcerpt($);
    const emails = extractEmails(textContent);
    const phoneNumber = countPhoneNumbers(textContent);

    const pageSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
    const pageSizeFormatted = formatBytes(pageSize);

    // Fetch real Google PageSpeed metrics if API Key is provided
    let googleMobile: any = null;
    let googleDesktop: any = null;

    if (options.includePageSpeed) {
      [googleMobile, googleDesktop] = await Promise.all([
        fetchPageSpeedMetrics(normalizedUrl, 'mobile'),
        fetchPageSpeedMetrics(normalizedUrl, 'desktop'),
      ]);

      if (options.onProgress) {
        await options.onProgress({
          ...initialData,
          images,
          scripts,
          stylesheets,
          // Partial indicator that performance is coming
        });
      }
    }

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
      requestedUrl: normalizedUrl,
      finalUrl,
      redirectUrls,
      redirectCount,
      isError: false,
      title,
      metaDescription,
      metaKeywords,
      canonical,
      robotsMeta,
      language,
      favicon,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        image: ogImage,
      },
      twitterCard: {
        card: twitterCard,
        title: twitterTitle,
        description: twitterDescription,
        image: twitterImage,
      },
      ...inlineMetrics,
      totalJsCount,
      minifiedJsCount,
      totalCssCount,
      minifiedCssCount,
      ...jsonLd,
      hasBreadcrumbLinks,
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

  const pageDetails: ScrapedPageData[] = await pool(sortedUrls, 3, async (pageUrl) => {
    const isFirst = sortedUrls.indexOf(pageUrl) === 0;
    try {
      return await scrapeWebPage(pageUrl, { includePageSpeed: isFirst });
    } catch (error) {
      console.error('Failed to scrape page during full-site analysis', {
        pageUrl,
        analyzedDomain,
        ...getErrorDetails(error),
      });
      return createErrorPageData(pageUrl);
    }
  });

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

export function createErrorPageData(url: string): ScrapedPageData {
  return {
    url,
    requestedUrl: url,
    finalUrl: null,
    redirectUrls: [],
    redirectCount: 0,
    isError: true,
    title: '',
    metaDescription: null,
    metaKeywords: null,
    canonical: null,
    robotsMeta: null,
    language: null,
    favicon: null,
    openGraph: {
      title: null,
      description: null,
      image: null,
    },
    twitterCard: {
      card: null,
      title: null,
      description: null,
      image: null,
    },
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
  concurrency: number = 3,
  includePageSpeedFirst: boolean = true
): Promise<ScrapedPageData[]> {
  return pool(urls, concurrency, async (url) => {
    const isFirst = urls.indexOf(url) === 0;
    try {
      return await scrapeWebPage(url, {
        includePageSpeed: isFirst && includePageSpeedFirst
      });
    } catch (error) {
      console.error('Bulk page scrape failed for URL', {
        url,
        ...getErrorDetails(error),
      });
      return createErrorPageData(url);
    }
  });
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
