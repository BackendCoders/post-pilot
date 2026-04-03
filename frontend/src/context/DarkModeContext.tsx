/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';

interface DarkModeContextValue {
	dark: boolean;
	toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextValue | undefined>(
	undefined,
);

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [dark, setDark] = useState(false);

	// whenever `dark` changes add/remove the `dark` class on the root element
	useEffect(() => {
		const root = document.documentElement;
		if (dark) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
	}, [dark]);

	const toggle = () => setDark((prev) => !prev);

	return (
		<DarkModeContext.Provider value={{ dark, toggle }}>
			{children}
		</DarkModeContext.Provider>
	);
};

export function useDarkMode() {
	const ctx = useContext(DarkModeContext);
	if (!ctx) {
		throw new Error('useDarkMode must be used within a DarkModeProvider');
	}
	return ctx;
}
