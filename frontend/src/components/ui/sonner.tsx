'use client';

import * as React from 'react';
import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = 'system' } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps['theme']}
			position='top-right'
			closeButton
			expand
			richColors
			visibleToasts={4}
			duration={3600}
			className='toaster group'
			icons={{
				success: <CircleCheckIcon className='size-4' />,
				info: <InfoIcon className='size-4' />,
				warning: <TriangleAlertIcon className='size-4' />,
				error: <OctagonXIcon className='size-4' />,
				loading: <Loader2Icon className='size-4 animate-spin' />,
			}}
			toastOptions={{
				classNames: {
					toast:
						'group toast-googly rounded-xl border shadow-lg backdrop-blur-md',
					title: 'font-semibold tracking-tight',
					description: 'text-[13px] opacity-90',
					actionButton:
						'bg-primary text-primary-foreground hover:bg-primary/90 rounded-md',
					cancelButton: 'bg-muted text-muted-foreground hover:bg-muted/80',
					closeButton:
						'border border-border bg-background/80 text-foreground hover:bg-background',
					success: 'toast-googly-success',
					error: 'toast-googly-error',
					warning: 'toast-googly-warning',
					info: 'toast-googly-info',
				},
			}}
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)',
					'--border-radius': 'var(--radius)',
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
