import jsPDF from 'jspdf';
import type { ScrapedPageData, SeoReport } from '@/types/seo.types';

interface ReportResult {
	base64: string;
	fileName: string;
}

const COLORS = {
	primary: [30, 41, 59], // Slate 800
	accent: [56, 189, 248], // Sky 400
	emerald: [16, 185, 129],
	blue: [59, 130, 246],
	amber: [245, 158, 11],
	orange: [249, 115, 22],
	red: [239, 68, 68],
	border: [226, 232, 240],
	text: [31, 41, 55],
	muted: [100, 116, 139],
	bg: [248, 250, 252],
};

const getGradeColor = (grade: string): number[] => {
	switch (grade) {
		case 'A': return COLORS.emerald;
		case 'B': return COLORS.blue;
		case 'C': return COLORS.amber;
		case 'D': return COLORS.orange;
		case 'F': return COLORS.red;
		default: return COLORS.blue;
	}
};

const buildPdfContent = (doc: jsPDF, results: ScrapedPageData[], reports: Record<string, SeoReport> = {}): void => {
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 20;
	const contentWidth = pageWidth - margin * 2;
	let yPos = margin;

	const addNewPageIfNeeded = (requiredSpace: number) => {
		if (yPos + requiredSpace > pageHeight - margin) {
			doc.addPage();
			yPos = margin;
			// Add a small header on subsequent pages
			doc.setFillColor(...COLORS.primary);
			doc.rect(0, 0, pageWidth, 15, 'F');
			yPos += 10;
		}
	};

	const drawHeader = () => {
		// Dark background header
		doc.setFillColor(...COLORS.primary);
		doc.rect(0, 0, pageWidth, 60, 'F');
		
		doc.setTextColor(255, 255, 255);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(28);
		doc.text('SEO ROCKET', margin, 35);
		
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.text('PERFORMANCE ANALYSIS REPORT', margin, 45);
		
		const date = new Date().toLocaleDateString('en-US', { 
			year: 'numeric', month: 'long', day: 'numeric' 
		});
		doc.text(`Generated: ${date}`, pageWidth - margin, 45, { align: 'right' });
		
		yPos = 75;
	};

	const drawSectionTitle = (title: string) => {
		addNewPageIfNeeded(20);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(14);
		doc.setTextColor(...COLORS.primary);
		doc.text(title.toUpperCase(), margin, yPos);
		
		doc.setDrawColor(...COLORS.accent);
		doc.setLineWidth(1);
		doc.line(margin, yPos + 2, margin + 20, yPos + 2);
		
		yPos += 12;
	};

	// --- 1. COVER / HEADER ---
	drawHeader();

	// --- 2. EXECUTIVE SUMMARY ---
	const totalWords = results.reduce((sum, p) => sum + p.wordCount, 0);
	const totalImages = results.reduce((sum, p) => sum + p.images.length, 0);
	const avgScore = Object.keys(reports).length > 0
		? Math.round(Object.values(reports).reduce((sum, r) => sum + r.totalScore, 0) / Object.keys(reports).length)
		: null;

	if (avgScore !== null) {
		const grade = avgScore >= 90 ? 'A' : avgScore >= 80 ? 'B' : avgScore >= 70 ? 'C' : avgScore >= 60 ? 'D' : 'F';
		const color = getGradeColor(grade);
		
		// Large Score Card
		doc.setFillColor(...COLORS.bg);
		doc.roundedRect(margin, yPos, contentWidth, 40, 4, 4, 'F');
		
		doc.setTextColor(...color);
		doc.setFontSize(36);
		doc.setFont('helvetica', 'bold');
		doc.text(avgScore.toString(), margin + 15, yPos + 27);
		
		doc.setTextColor(...COLORS.primary);
		doc.setFontSize(12);
		doc.text('OVERALL SCORE', margin + 60, yPos + 18);
		
		doc.setFontSize(10);
		doc.setTextColor(...COLORS.muted);
		doc.text(`Performance Grade: ${grade}`, margin + 60, yPos + 26);
		
		yPos += 55;
	}

	drawSectionTitle('Executive Summary');
	
	// Stats Grid
	const stats = [
		{ label: 'Pages Analyzed', value: results.length.toString() },
		{ label: 'Total Content', value: `${totalWords.toLocaleString()} words` },
		{ label: 'Avg Word Count', value: `${Math.round(totalWords / results.length)} per page` },
		{ label: 'Total Media', value: `${totalImages} images` },
	];

	doc.setFontSize(10);
	stats.forEach((stat, i) => {
		const x = margin + (i % 2) * (contentWidth / 2);
		const y = yPos + Math.floor(i / 2) * 15;
		doc.setTextColor(...COLORS.muted);
		doc.text(stat.label, x, y);
		doc.setTextColor(...COLORS.primary);
		doc.setFont('helvetica', 'bold');
		doc.text(stat.value, x + 40, y);
		doc.setFont('helvetica', 'normal');
	});
	
	yPos += 40;

	// --- 3. PAGE DETAILS ---
	drawSectionTitle('Detailed Page Analysis');

	results.forEach((page, index) => {
		const report = reports[page.url];
		const score = report?.totalScore;
		const grade = report?.grade;
		
		addNewPageIfNeeded(80);
		
		// Page Header Row
		doc.setFillColor(...COLORS.bg);
		doc.rect(margin, yPos, contentWidth, 12, 'F');
		
		doc.setTextColor(...COLORS.primary);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(10);
		doc.text(`PAGE ${index + 1}: ${page.url.substring(0, 70)}${page.url.length > 70 ? '...' : ''}`, margin + 5, yPos + 8);
		
		if (grade) {
			const color = getGradeColor(grade);
			doc.setFillColor(...color);
			doc.roundedRect(pageWidth - margin - 25, yPos + 2, 20, 8, 2, 2, 'F');
			doc.setTextColor(255, 255, 255);
			doc.setFontSize(8);
			doc.text(`Grade ${grade}`, pageWidth - margin - 15, yPos + 7.5, { align: 'center' });
		}
		
		yPos += 20;

		if (page.isError) {
			doc.setTextColor(...COLORS.red);
			doc.setFontSize(9);
			doc.text('⚠ ERROR: Unable to analyze this page content.', margin + 5, yPos);
			yPos += 15;
			return;
		}

		// Metrics Grid
		doc.setTextColor(...COLORS.primary);
		doc.setFontSize(9);
		const metrics = [
			`Title: ${page.title || 'N/A'}`,
			`Description: ${page.metaDescription ? 'Present' : 'MISSING'}`,
			`Word Count: ${page.wordCount}`,
			`Links: ${page.internalLinkCount} Internal / ${page.externalLinkCount} External`,
		];
		
		metrics.forEach(m => {
			doc.text(`• ${m}`, margin + 5, yPos);
			yPos += 6;
		});

		// Critical Issues
		const issues = [];
		if (!page.metaDescription) issues.push({ msg: 'Missing Meta Description', sev: 'high' });
		if (page.headings.h1.length === 0) issues.push({ msg: 'Missing H1 Heading', sev: 'high' });
		const missingAlt = page.images.filter(i => !i.alt).length;
		if (missingAlt > 0) issues.push({ msg: `${missingAlt} Images missing ALT tags`, sev: 'medium' });

		if (issues.length > 0) {
			yPos += 4;
			issues.forEach(issue => {
				const color = issue.sev === 'high' ? COLORS.red : COLORS.amber;
				doc.setTextColor(...color);
				doc.setFont('helvetica', 'bold');
				doc.text(`! ${issue.msg}`, margin + 5, yPos);
				yPos += 5;
			});
			doc.setFont('helvetica', 'normal');
		}

		yPos += 10;
		doc.setDrawColor(...COLORS.border);
		doc.line(margin, yPos, pageWidth - margin, yPos);
		yPos += 10;
	});

	// --- FOOTER ---
	const finalY = pageHeight - 15;
	doc.setFontSize(8);
	doc.setTextColor(...COLORS.muted);
	doc.text('Generated by SEO Rocket Premium Engine', margin, finalY);
	doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, finalY, { align: 'right' });
};

export const generateSeoReport = (results: ScrapedPageData[], reports: Record<string, SeoReport> = {}): void => {
	const doc = new jsPDF();
	buildPdfContent(doc, results, reports);
	doc.save(`seo-report-${Date.now()}.pdf`);
};

export const generateSeoReportBase64 = (results: ScrapedPageData[], reports: Record<string, SeoReport> = {}): ReportResult => {
	const doc = new jsPDF();
	buildPdfContent(doc, results, reports);
	const fileName = `seo-report-${Date.now()}.pdf`;
	const dataUri = doc.output('datauristring');
	const base64 = dataUri.split(',')[1];
	return { base64, fileName };
};
