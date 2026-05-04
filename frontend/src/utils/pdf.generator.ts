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
			// Add a slim header on subsequent pages
			doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
			doc.rect(0, 0, pageWidth, 10, 'F');
			yPos += 15;
		}
	};

	const drawHeader = () => {
		doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
		doc.rect(0, 0, pageWidth, 60, 'F');

		doc.setTextColor(255, 255, 255);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(32);
		doc.text('SEO ROCKET', margin, 35);

		doc.setFontSize(12);
		doc.setFont('helvetica', 'normal');
		doc.text('PREMIUM AUDIT & PERFORMANCE REPORT', margin, 45);

		const date = new Date().toLocaleDateString('en-US', {
			year: 'numeric', month: 'long', day: 'numeric'
		});
		doc.setFontSize(10);
		doc.text(`Generated: ${date}`, pageWidth - margin, 45, { align: 'right' });

		yPos = 75;
	};

	const drawSectionTitle = (title: string) => {
		addNewPageIfNeeded(30);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(16);
		doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
		doc.text(title.toUpperCase(), margin, yPos);

		doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
		doc.setLineWidth(1.5);
		doc.line(margin, yPos + 3, margin + 25, yPos + 3);

		yPos += 15;
	};

	const drawScoreGauge = (x: number, y: number, score: number, label: string) => {
		const radius = 25;
		const centerX = x + radius;
		const centerY = y + radius;

		// Background circle (muted)
		doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
		doc.setLineWidth(5);
		doc.circle(centerX, centerY, radius, 'S');

		// Score arc (approximated with segments)
		const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
		const color = getGradeColor(grade);
		doc.setDrawColor(color[0], color[1], color[2]);

		// Draw segments for the arc
		const segments = (score / 100) * 32;
		for (let i = 0; i < segments; i++) {
			const angle = (i / 32) * 2 * Math.PI - Math.PI / 2;
			const nextAngle = ((i + 1) / 32) * 2 * Math.PI - Math.PI / 2;

			const x1 = centerX + Math.cos(angle) * radius;
			const y1 = centerY + Math.sin(angle) * radius;
			const x2 = centerX + Math.cos(nextAngle) * radius;
			const y2 = centerY + Math.sin(nextAngle) * radius;

			doc.line(x1, y1, x2, y2);
		}

		// Score text
		doc.setFontSize(24);
		doc.setTextColor(color[0], color[1], color[2]);
		doc.setFont('helvetica', 'bold');
		doc.text(score.toString(), centerX, centerY + 5, { align: 'center' });

		doc.setFontSize(10);
		doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
		doc.setFont('helvetica', 'normal');
		doc.text(label, centerX, centerY + radius + 10, { align: 'center' });
	};

	const drawBarChart = (x: number, y: number, width: number, sections: any) => {
		const barHeight = 8;
		const gap = 6;
		let currentY = y;

		Object.entries(sections).forEach(([name, data]: [string, any]) => {
			const score = data.score;
			const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
			const color = getGradeColor(grade);

			// Label
			doc.setFontSize(9);
			doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
			doc.text(name.toUpperCase(), x, currentY + 6);

			// Bar background
			doc.setFillColor(COLORS.bg[0], COLORS.bg[1], COLORS.bg[2]);
			doc.rect(x + 30, currentY, width - 30, barHeight, 'F');

			// Bar fill
			doc.setFillColor(color[0], color[1], color[2]);
			doc.rect(x + 30, currentY, (score / 100) * (width - 30), barHeight, 'F');

			// Score text
			doc.setFontSize(8);
			doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
			doc.text(`${score}/100`, x + width + 5, currentY + 6);

			currentY += barHeight + gap;
		});

		return currentY;
	};

	// --- 1. COVER / HEADER ---
	drawHeader();

	// --- 2. EXECUTIVE SUMMARY & CHARTS ---
	const avgScore = Object.keys(reports).length > 0
		? Math.round(Object.values(reports).reduce((sum, r) => sum + r.totalScore, 0) / Object.keys(reports).length)
		: results[0]?.analysisReport?.totalScore || 0;

	// Visual Dashboard Section
	doc.setFillColor(COLORS.bg[0], COLORS.bg[1], COLORS.bg[2]);
	doc.roundedRect(margin, yPos, contentWidth, 80, 4, 4, 'F');

	// Draw Overall Score Gauge
	drawScoreGauge(margin + 20, yPos + 10, avgScore, 'Overall SEO Score');

	// Draw Section Bar Chart next to it
	if (Object.keys(reports).length > 0) {
		const firstReport = Object.values(reports)[0];
		drawBarChart(margin + 90, yPos + 15, contentWidth - 130, firstReport.sections);
	}

	yPos += 95;

	drawSectionTitle('Executive Summary');

	const totalWords = results.reduce((sum, p) => sum + p.wordCount, 0);
	const totalImages = results.reduce((sum, p) => sum + p.images.length, 0);
	const totalLinks = results.reduce((sum, p) => sum + p.internalLinkCount + p.externalLinkCount, 0);

	const stats = [
		{ label: 'Pages Analyzed', value: results.length.toString() },
		{ label: 'Total Word Count', value: totalWords.toLocaleString() },
		{ label: 'Average Score', value: `${avgScore}/100` },
		{ label: 'Total Assets', value: `${totalImages} images, ${totalLinks} links` },
	];

	doc.setFontSize(10);
	stats.forEach((stat, i) => {
		const x = margin + (i % 2) * (contentWidth / 2);
		const y = yPos + Math.floor(i / 2) * 15;
		doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
		doc.text(stat.label, x, y);
		doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
		doc.setFont('helvetica', 'bold');
		doc.text(stat.value, x + 45, y);
		doc.setFont('helvetica', 'normal');
	});

	yPos += 45;

	// --- 3. RECOMMENDATIONS (NEW) ---
	const allIssues = results.flatMap(p => {
		const report = reports[p.url];
		if (!report) return [];
		return Object.values(report.sections).flatMap(s => s.issues);
	}).filter(i => i.severity === 'high').slice(0, 5);

	if (allIssues.length > 0) {
		drawSectionTitle('Top Actionable Recommendations');
		doc.setFontSize(10);
		allIssues.forEach((issue) => {
			addNewPageIfNeeded(15);
			doc.setFillColor(COLORS.red[0], COLORS.red[1], COLORS.red[2]);
			doc.circle(margin + 2, yPos - 3, 1, 'F');
			doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
			doc.setFont('helvetica', 'bold');
			doc.text(issue.message, margin + 8, yPos);
			yPos += 5;
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
			doc.text(`Fix: ${issue.fix}`, margin + 8, yPos);
			yPos += 8;
		});
		yPos += 10;
	}

	// --- 4. DETAILED PAGE ANALYSIS ---
	drawSectionTitle('Detailed Page Analysis');

	results.forEach((page, index) => {
		const report = reports[page.url];
		const grade = report?.grade;

		addNewPageIfNeeded(100);

		// Page Header
		doc.setFillColor(COLORS.bg[0], COLORS.bg[1], COLORS.bg[2]);
		doc.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'F');

		doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(11);
		doc.text(`${index + 1}. ${page.url.substring(0, 80)}${page.url.length > 80 ? '...' : ''}`, margin + 5, yPos + 10);

		if (grade) {
			const color = getGradeColor(grade);
			doc.setFillColor(color[0], color[1], color[2]);
			doc.roundedRect(pageWidth - margin - 30, yPos + 3, 25, 9, 2, 2, 'F');
			doc.setTextColor(255, 255, 255);
			doc.setFontSize(9);
			doc.text(`GRADE ${grade}`, pageWidth - margin - 17.5, yPos + 9.5, { align: 'center' });
		}

		yPos += 25;

		if (page.isError) {
			doc.setTextColor(COLORS.red[0], COLORS.red[1], COLORS.red[2]);
			doc.text('⚠ Analysis failed for this URL.', margin + 5, yPos);
			yPos += 20;
			return;
		}

		// Mini Section Scores
		if (report) {
			doc.setFontSize(9);
			doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
			const sectionKeys = Object.keys(report.sections);
			sectionKeys.forEach((key, i) => {
				const x = margin + 5 + (i % 4) * (contentWidth / 4);
				const y = yPos + Math.floor(i / 4) * 12;
				const section = report.sections[key as keyof typeof report.sections];
				doc.text(`${key.toUpperCase()}: ${section.score}/100`, x, y);
			});
			yPos += 25;
		}

		// Metrics
		doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
		doc.setFontSize(9);
		const metrics = [
			`Title: ${page.title || 'N/A'}`,
			`Word Count: ${page.wordCount} words`,
			`Images: ${page.images.length} (${page.images.filter(i => !i.alt).length} missing alt)`,
			`Links: ${page.internalLinkCount} internal, ${page.externalLinkCount} external`,
		];

		metrics.forEach(m => {
			doc.text(`• ${m}`, margin + 5, yPos);
			yPos += 6;
		});

		yPos += 15;
		doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
		doc.setLineWidth(0.5);
		doc.line(margin, yPos, pageWidth - margin, yPos);
		yPos += 15;
	});

	// --- FOOTER ---
	const finalY = pageHeight - 15;
	doc.setFontSize(8);
	doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
	doc.text('Generated by SEO Rocket Premium - The Complete Website Audit Solution', margin, finalY);
	doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, finalY, { align: 'right' });
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
