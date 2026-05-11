import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import {
	useWhatsAppStatus,
	useWhatsAppStart,
	useWhatsAppLogout,
} from '@/query/whatsapp.query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

type WhatsAppConnectionPanelProps = {
	autoStart?: boolean;
};

const WA_GUIDELINES_DISMISS_KEY = 'pp_whatsapp_guidelines_dismissed_v1';

export default function WhatsAppConnectionPanel({
	autoStart = false,
}: WhatsAppConnectionPanelProps) {
	const statusQuery = useWhatsAppStatus();
	const startMutation = useWhatsAppStart();
	const logoutMutation = useWhatsAppLogout();
	const hasAutoStarted = useRef(false);

	const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
	const [dontShowAgain, setDontShowAgain] = useState(false);
	const [canShowQr, setCanShowQr] = useState(() => {
		try {
			return localStorage.getItem(WA_GUIDELINES_DISMISS_KEY) === '1';
		} catch {
			return false;
		}
	});

	useEffect(() => {
		if (
			autoStart &&
			statusQuery.data?.state === 'DISCONNECTED' &&
			!hasAutoStarted.current
		) {
			if (!canShowQr) return;
			hasAutoStarted.current = true;
			startMutation.mutate(undefined, {
				onError: () => {
					toast.error('Failed to start WhatsApp connection');
				},
			});
		}
	}, [autoStart, startMutation, statusQuery.data?.state]);

	const handleStartConnection = () => {
		const dismissed = canShowQr;
		if (dismissed && statusQuery.data?.state === 'DISCONNECTED') {
			startMutation.mutate(undefined, {
				onError: () => {
					toast.error('Failed to start WhatsApp connection');
				},
			});
			return;
		}

		setDontShowAgain(false);
		setIsGuidelinesOpen(true);
	};

	const handleGuidelinesContinue = () => {
		if (dontShowAgain) {
			localStorage.setItem(WA_GUIDELINES_DISMISS_KEY, '1');
		}
		setCanShowQr(true);
		setIsGuidelinesOpen(false);

		if (statusQuery.data?.state === 'DISCONNECTED') {
			startMutation.mutate(undefined, {
				onError: () => {
					toast.error('Failed to start WhatsApp connection');
				},
			});
		}
	};

	const handleDisconnect = () => {
		if (confirm('Are you sure you want to disconnect WhatsApp?')) {
			logoutMutation.mutate(undefined, {
				onSuccess: () => {
					toast.success('WhatsApp disconnected');
				},
			});
		}
	};

	if (statusQuery.isLoading) {
		return (
			<div className='flex items-center justify-center py-12'>
				<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary' />
			</div>
		);
	}

	if (statusQuery.data?.state === 'CONNECTED') {
		return (
			<div className='space-y-6'>
				<div className='flex items-center gap-4 p-4 bg-green-500/5 rounded-xl border border-green-500/20'>
					<div className='relative'>
						<div className='w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-600'>
							<MessageCircle size={24} />
						</div>
						<div className='absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-card rounded-full' />
					</div>
					<div className='flex-1'>
						<p className='text-sm font-semibold text-foreground'>
							Active Connection
						</p>
						<p className='text-xs text-muted-foreground font-mono'>
							{statusQuery.data.phoneNumber}
						</p>
					</div>
				</div>
				<button
					onClick={handleDisconnect}
					disabled={logoutMutation.isPending}
					className='px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-95'
				>
					{logoutMutation.isPending ? 'Disconnecting...' : 'Terminate Connection'}
				</button>
			</div>
		);
	}

	const qr = statusQuery.data?.qr ?? undefined;
	const shouldShowQr =
		canShowQr && statusQuery.data?.state === 'AWAITING_SCAN' && !!qr;

	return (
		<div className='flex flex-col items-center py-4 space-y-4'>
			<Dialog
				open={isGuidelinesOpen}
				onOpenChange={setIsGuidelinesOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Before you connect WhatsApp Web</DialogTitle>
						<DialogDescription>
							Please review these quick guidelines to keep your account safe and
							stay compliant.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-3 text-sm text-muted-foreground'>
						<ul className='list-disc pl-5 space-y-2'>
							<li>
								This connection uses <span className='font-medium'>WhatsApp Web</span>{' '}
								(QR login) to link your account.
							</li>
							<li>
								We <span className='font-medium'>do not store your personal messages</span>{' '}
								in our database. Your chats stay in WhatsApp.
							</li>
							<li>
								Your login session is{' '}
								<span className='font-medium'>encrypted and protected</span>. Still,
								only connect on trusted devices.
							</li>
							<li>
								We strongly recommend connecting a{' '}
								<span className='font-medium'>business WhatsApp number</span>, not
								your personal number.
							</li>
							<li>
								Avoid <span className='font-medium'>bulk messaging / spam</span>. Large
								blasts can lead to rate limits or account bans by WhatsApp.
							</li>
						</ul>

						<div className='flex items-center gap-2 pt-1'>
							<Checkbox
								id='wa-guidelines-dismiss'
								checked={dontShowAgain}
								onCheckedChange={(checked) => setDontShowAgain(checked === true)}
							/>
							<label
								htmlFor='wa-guidelines-dismiss'
								className='text-sm text-foreground'
							>
								Don’t show this again
							</label>
						</div>
					</div>

					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => setIsGuidelinesOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type='button'
							onClick={handleGuidelinesContinue}
						>
							I Understand &amp; Continue
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{(statusQuery.data?.state === 'DISCONNECTED' ||
				(statusQuery.data?.state === 'AWAITING_SCAN' && !canShowQr)) && (
				<button
					type='button'
					onClick={handleStartConnection}
					disabled={startMutation.isPending}
					className='px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50'
				>
					{startMutation.isPending ? 'Starting...' : 'Connect WhatsApp Web'}
				</button>
			)}

			<div className='w-full max-w-[280px] p-6 bg-background rounded-xl border border-border border-dashed text-center space-y-4'>
				{shouldShowQr ? (
					<>
						<p className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>
							Scan to Connect
						</p>
						<div className='p-2 bg-white rounded-lg inline-block shadow-sm'>
							<img
								src={qr}
								alt='QR'
								className='w-40 h-40'
							/>
						</div>
						<p className='text-[10px] text-muted-foreground italic'>
							Refreshes every 3s
						</p>
					</>
				) : statusQuery.data?.state === 'AWAITING_SCAN' && !canShowQr ? (
					<div className='py-8 flex flex-col items-center space-y-3'>
						<p className='text-xs text-muted-foreground'>
							Review guidelines to view the QR code
						</p>
						<p className='text-[10px] text-muted-foreground italic'>
							Click connect to continue
						</p>
					</div>
				) : statusQuery.data?.state === 'DISCONNECTED' &&
				  !startMutation.isPending ? (
					<div className='py-8 flex flex-col items-center space-y-3'>
						<p className='text-xs text-muted-foreground'>
							WhatsApp is not connected
						</p>
						<p className='text-[10px] text-muted-foreground italic'>
							Click connect to generate a QR code
						</p>
					</div>
				) : (
					<div className='py-8 flex flex-col items-center space-y-3'>
						<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-primary' />
						<p className='text-xs text-muted-foreground'>
							Establishing secure link...
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
