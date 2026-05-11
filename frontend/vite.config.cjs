const path = require('path');
const { defineConfig } = require('vite');
const reactImport = require('@vitejs/plugin-react');
const tailwindcssImport = require('@tailwindcss/vite');

const react = reactImport.default ?? reactImport;
const tailwindcss = tailwindcssImport.default ?? tailwindcssImport;

// https://vite.dev/config/
module.exports = defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
