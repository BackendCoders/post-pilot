import axios from 'axios';
import * as cheerio from 'cheerio';
import xml2js from 'xml2js';

interface CategorizedUrls {
  blog: string[];
  product: string[];
  category: string[];
  post: string[];
  pages: string[];
  other: string[];
}

interface PageHeadingMap {
  h1: string[];
  h2: string[];
  h3: string[];
  h4: string[];
  h5: string[];
  h6: string[];
}

interface PageImage {
  src: string | null;
  alt: string | null;
}

interface ScrapedPageData {
  url: string;
  title: string;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  headings: PageHeadingMap;
  images: PageImage[];
  links: string[];
  socialLinks: string[];
  paragraphExcerpt: string[];
  textSample: string;
  wordCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
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

function categorize(url: string): keyof CategorizedUrls {
  if (url.includes('/blog/')) return 'blog';
  if (url.includes('/product/')) return 'product';
  if (url.includes('/pages/')) return 'pages';
  if (url.includes('/posts/') || url.includes('/post/')) return 'post';
  if (url.includes('/category/')) return 'category';

  return 'other';
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
): Promise<string[]> {
  if (visited.has(url)) {
    return [];
  }

  visited.add(url);

  try {
    const parsed = await fetchXml(url);

    if (parsed.urlset?.url) {
      return parsed.urlset.url
        .map((item: { loc?: string[] }) => item.loc?.[0])
        .filter((value: string | undefined): value is string => Boolean(value));
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

      return nestedResults.flat();
    }

    return [];
  } catch (error) {
    console.error('Failed to parse sitemap', {
      sitemapUrl: url,
      ...getErrorDetails(error),
    });
    return [];
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

function scrapAltTextOfImages(
  $: cheerio.CheerioAPI,
  baseUrl: string
): PageImage[] {
  const images: PageImage[] = [];

  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || null;

    images.push({
      src: src ? resolveUrl(baseUrl, src) : null,
      alt,
    });
  });

  return images;
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

function extractWordCount(text: string): number {
  const trimmed = text.trim();

  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

async function scrapeWebPage(url: string): Promise<ScrapedPageData> {
  try {
    const normalizedUrl = normalizeUrl(url);
    const { data } = await axios.get(normalizedUrl, {
      timeout: 20000,
      responseType: 'text',
    });
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
    const images = scrapAltTextOfImages($, normalizedUrl);
    const links = scrapLinks($, normalizedUrl);
    const socialLinks = scrapSocialLinks(links);
    const pageOrigin = getDomain(normalizedUrl);
    const internalLinkCount = links.filter((link) =>
      link.startsWith(pageOrigin)
    ).length;
    const externalLinkCount = links.length - internalLinkCount;
    const paragraphExcerpt = extractParagraphExcerpt($);

    return {
      url: normalizedUrl,
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
    };
  } catch (error) {
    console.error('Web page scrape failed', {
      url,
      ...getErrorDetails(error),
    });
    throw createHttpError('Failed to scrape the requested web page', 502);
  }
}

async function crawlSite(domainOrUrl: string): Promise<SiteScrapeResult> {
  const normalizedUrl = normalizeUrl(domainOrUrl);
  const analyzedDomain = getDomain(normalizedUrl);
  const categorized: CategorizedUrls = {
    blog: [],
    post: [],
    product: [],
    category: [],
    pages: [],
    other: [],
  };

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

  const discoveredUrls = new Set<string>();

  for (const sitemapUrl of sitemapUrls) {
    const sitemapPageUrls = await collectUrlsFromSitemap(sitemapUrl);

    for (const pageUrl of sitemapPageUrls) {
      if (pageUrl.startsWith(analyzedDomain)) {
        discoveredUrls.add(pageUrl);
      }
    }
  }

  const sortedUrls = Array.from(discoveredUrls).sort();

  for (const pageUrl of sortedUrls) {
    categorized[categorize(pageUrl)].push(pageUrl);
  }

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

async function countSitePages(domainOrUrl: string): Promise<SitePageCountResult> {
  const normalizedUrl = normalizeUrl(domainOrUrl);
  const analyzedDomain = getDomain(normalizedUrl);
  const categorized: CategorizedUrls = {
    blog: [],
    post: [],
    product: [],
    category: [],
    pages: [],
    other: [],
  };

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

  const discoveredUrls = new Set<string>();

  for (const sitemapUrl of sitemapUrls) {
    const sitemapPageUrls = await collectUrlsFromSitemap(sitemapUrl);

    for (const pageUrl of sitemapPageUrls) {
      if (pageUrl.startsWith(analyzedDomain)) {
        discoveredUrls.add(pageUrl);
      }
    }
  }

  const urls = Array.from(discoveredUrls).sort();

  for (const pageUrl of urls) {
    categorized[categorize(pageUrl)].push(pageUrl);
  }

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

async function scrapeMultipleWebPages(urls: string[]): Promise<ScrapedPageData[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        return await scrapeWebPage(url);
      } catch (error) {
        console.error('Bulk page scrape failed for URL', {
          url,
          ...getErrorDetails(error),
        });
        return null;
      }
    })
  );

  return results.filter(
    (result): result is ScrapedPageData => Boolean(result)
  );
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
  ScrapedPageData,
  SitePageCountResult,
  SiteScrapeResult,
};
export {
  analyzeUrl,
  countSitePages,
  crawlSite,
  scrapeMultipleWebPages,
  scrapeWebPage,
};
