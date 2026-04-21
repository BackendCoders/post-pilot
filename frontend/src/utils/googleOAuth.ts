const GOOGLE_CLIENT_SCRIPT = 'https://accounts.google.com/gsi/client';
const FALLBACK_GOOGLE_CLIENT_ID =
	'831663018449-b111oseevnrc4kqj0ofc2ca50kdtim77.apps.googleusercontent.com';

let googleScriptPromise: Promise<void> | null = null;

const getGoogleClientId = () =>
	import.meta.env.VITE_GOOGLE_CLIENT_ID || FALLBACK_GOOGLE_CLIENT_ID;

const loadGoogleScript = () => {
	if (googleScriptPromise) return googleScriptPromise;

	googleScriptPromise = new Promise((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(
			`script[src="${GOOGLE_CLIENT_SCRIPT}"]`,
		);

		if (existing) {
			if ((window as any).google?.accounts) {
				resolve();
				return;
			}
			existing.addEventListener('load', () => resolve(), { once: true });
			existing.addEventListener(
				'error',
				() => reject(new Error('Failed to load Google sign-in script')),
				{ once: true },
			);
			return;
		}

		const script = document.createElement('script');
		script.src = GOOGLE_CLIENT_SCRIPT;
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () =>
			reject(new Error('Failed to load Google sign-in script'));
		document.head.appendChild(script);
	});

	return googleScriptPromise;
};

export const requestGoogleAccessToken = async (): Promise<string> => {
	const googleClientId = getGoogleClientId();

	if (!googleClientId) {
		throw new Error('Google client id is not configured');
	}

	await loadGoogleScript();

	const google = (window as any).google;
	if (!google?.accounts?.oauth2) {
		throw new Error('Google sign-in client is not available');
	}

	return new Promise((resolve, reject) => {
		const tokenClient = google.accounts.oauth2.initTokenClient({
			client_id: googleClientId,
			scope: 'openid email profile',
			callback: (response: { access_token?: string; error?: string }) => {
				if (response?.error) {
					reject(new Error('Google sign-in was cancelled or failed'));
					return;
				}

				if (!response?.access_token) {
					reject(new Error('Google did not return an access token'));
					return;
				}

				resolve(response.access_token);
			},
		});

		tokenClient.requestAccessToken({ prompt: 'consent' });
	});
};
