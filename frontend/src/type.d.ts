enum UserRole {
	USER = 'user',
	ADMIN = 'admin',
	MODERATOR = 'moderator',
}

interface IApiResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
	errors?: Record<string, string[]>;
}

interface IMessageTemplate {
	_id?: string;
	user?: Types.ObjectId;
	title: string;
	description?: string;
	content: string;
}

interface UserType {
	id: string;
	email: string;
	userName: string;
	role: UserRole;
	isActive: boolean;
	avatar: string;
	phoneNumber: string;
	companyName: string;
	companySize: '1-10' | '11-50' | '51-200' | '201-500' | '500+' | '';
	jobTitle: string;
	website: string;
	linkedinUrl: string;
	timezone: string;
	language: 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | '';
	emailNotifications: boolean;
	subscriptionPlan: 'free' | 'pro' | 'enterprise';
	emailVerified: boolean;
	twoFactorEnabled: boolean;
	loginCount: number;
	lastActiveAt: string;
	lastLogin: string;
	createdAt: string;
	updatedAt: string;
}

interface ILoginResponse {
	user: {
		id: string;
		email: string;
		userName: string;
		role: UserRole;
	};
	token: string;
	refreshToken: string;
}

interface ILeadCategory {
	_id: string;
	user: string;
	title: string;
	description?: string | null;
	createdAt?: string;
	updatedAt?: string;
}

interface ILead {
	_id?: string;
	user: Types.ObjectId;
	leadCategory: Types.ObjectId;
	position?: number;
	phone?: string;
	website?: string;
	thumbnailUrl?: string;
	title?: string;
	address?: string;
	latitude?: number;
	longitude?: number;
	rating?: number;
	ratingCount?: number;
	category?: string;
	googleMapUrl?: string;
	note?: string;
	status: (typeof LEAD_STATUSES)[number];
	createdAt?: Date;
	updatedAt?: Date;
}

interface ISocialTypes {
	_id: string;
	insta_auth_token?: string;
	meta_auth_token?: string;
	linkedin_auth_token?: string;
	tiktok_auth_token?: string;
	user: string;
}

interface ILeadScrapResult {
	position: number;
	title: string;
	address: string;
	latitude: number;
	longitude: number;
	rating: number;
	ratingCount: number;
	priceLevel?: string;
	type?: string;
	types?: string[];
	website?: string;
	phoneNumber?: string;
	description?: string;
	openingHours?: Record<string, string>;
	thumbnailUrl?: string;
	cid?: string;
	fid?: string;
	placeId?: string;
}

interface IBulkLeadInput {
	position: number;
	title: string;
	address: string;
	phone: string;
	website: string;
	latitude: number;
	longitude: number;
	thumbnailUrl: string;
	rating: number;
	ratingCount: number;
	googleMapUrl: string;
	leadCategory: string;
}

interface IBulkCreateLeadsBody {
	leads: IBulkLeadInput[];
	user?: string;
}

interface IBulkUpdateBody {
	ids: string[];
	status: string;
}

// SEO Types
interface ISeoCountPagesResponse {
  requestedUrl: string;
  analyzedDomain: string;
  totalPages: number;
  sitemapUrls: string[];
  categorizedUrls: {
    blog: string[];
    product: string[];
    category: string[];
    post: string[];
    pages: string[];
    other: string[];
  };
  urls: string[];
}

interface ISeoScrapeResponse {
  success: boolean;
  mode: 'page' | 'site';
  requestedUrl: string;
  normalizedUrl: string;
  data: ScrapedPageData | SiteScrapeResult;
  message: string;
}

interface ISeoBulkScrapeResponse {
  success: boolean;
  requestedCount: number;
  scrapedCount: number;
  failedCount: number;
  data: ScrapedPageData[];
  message: string;
}

export * from './types/seo.types';
