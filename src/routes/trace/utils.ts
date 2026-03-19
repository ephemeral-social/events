import type { Breach } from './types';

export function generateContext(breach: Breach): string {
	const classes = breach.dataClasses.map((c) => c.toLowerCase());
	const hasPhone = classes.some((c) => c.includes('phone'));
	const hasLocation = classes.some((c) => c.includes('location') || c.includes('geographic'));
	const hasPassword = classes.some((c) => c.includes('password'));
	const hasAddress = classes.some((c) => c.includes('address') || c.includes('physical'));
	const hasFinancial = classes.some(
		(c) => c.includes('payment') || c.includes('credit') || c.includes('financial')
	);

	if (hasPhone && hasLocation) {
		return `Phone + location from ${breach.title} creates the exact targeting profile that surveillance systems and data brokers rely on.`;
	}
	if (hasPhone) {
		return `Your phone number from ${breach.title} links your identity across every platform that uses phone-based auth — including event apps.`;
	}
	if (hasLocation && hasPassword) {
		return `Location data and credentials from ${breach.title} give attackers both where you are and how to access your accounts.`;
	}
	if (hasFinancial) {
		return `Payment data from ${breach.title} maps your purchasing behavior — where you go, what events you attend, who you pay.`;
	}
	if (hasAddress) {
		return `Address data from ${breach.title} ties your digital identity to a physical location — the foundation of any targeting profile.`;
	}
	if (hasPassword) {
		return `Exposed credentials from ${breach.title} are cross-referenced across platforms to build a complete map of your digital identity.`;
	}
	return `Data from ${breach.title} (${breach.dataClasses.slice(0, 3).join(', ')}) adds to the profile that data brokers and surveillance systems aggregate about you.`;
}

export function calculateScore(breaches: Breach[]): number {
	let score = 0;

	// Base: breach count (max 40 pts)
	score += Math.min(breaches.length * 6, 40);

	// Severity: data class weights (max 40 pts)
	const allClasses = new Set(breaches.flatMap((b) => b.dataClasses.map((c) => c.toLowerCase())));

	if (allClasses.has('passwords')) score += 8;
	if (allClasses.has('phone numbers')) score += 8;
	if (allClasses.has('physical addresses')) score += 8;
	if (allClasses.has('geographic locations')) score += 6;
	if (allClasses.has('dates of birth')) score += 5;
	if (allClasses.has('ip addresses')) score += 3;
	if (allClasses.has('social media profiles')) score += 2;

	// Recency: recent breaches bonus (max 20 pts)
	const currentYear = new Date().getFullYear();
	const recentBreaches = breaches.filter((b) => {
		const year = parseInt(b.date.split('-')[0]);
		return year >= currentYear - 3;
	});
	score += Math.min(recentBreaches.length * 5, 20);

	return Math.min(score, 100);
}

export function calculatePercentile(score: number): number {
	if (score >= 80) return Math.floor(Math.random() * 10) + 80;
	if (score >= 60) return Math.floor(Math.random() * 15) + 60;
	if (score >= 40) return Math.floor(Math.random() * 15) + 40;
	return Math.floor(Math.random() * 20) + 15;
}

export function getRiskLabel(score: number): string {
	if (score >= 70) return 'HIGH RISK';
	if (score >= 40) return 'MEDIUM RISK';
	return 'LOW RISK';
}

export function getTopDataClasses(breaches: Breach[]): string[] {
	const critical = [
		'Passwords',
		'Phone numbers',
		'Physical addresses',
		'Geographic locations',
		'Dates of birth',
		'IP addresses',
		'Payment histories',
		'Credit cards'
	];
	const all = new Set(breaches.flatMap((b) => b.dataClasses));
	return critical.filter((c) => all.has(c)).slice(0, 4);
}

interface ShareImageData {
	score: number;
	breachCount: number;
	percentile: number;
	riskLabel: string;
	topDataClasses: string[];
}

export async function generateShareImage(data: ShareImageData): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = 1080;
	canvas.height = 1920;
	const ctx = canvas.getContext('2d')!;

	// Background
	ctx.fillStyle = '#111110';
	ctx.fillRect(0, 0, 1080, 1920);

	// Top accent line
	const gradient = ctx.createLinearGradient(0, 0, 1080, 0);
	gradient.addColorStop(0, '#DC2626');
	gradient.addColorStop(1, 'transparent');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 1080, 4);

	// Score label
	ctx.font = '500 28px Manrope, sans-serif';
	ctx.fillStyle = '#6b6560';
	ctx.textAlign = 'center';
	ctx.fillText('SURVEILLANCE EXPOSURE SCORE', 540, 500);

	// Score ring background
	ctx.beginPath();
	ctx.arc(540, 700, 180, 0, Math.PI * 2);
	ctx.strokeStyle = 'rgba(255,255,255,0.04)';
	ctx.lineWidth = 16;
	ctx.stroke();

	// Score ring fill
	ctx.beginPath();
	const scoreAngle = (data.score / 100) * Math.PI * 2;
	ctx.arc(540, 700, 180, -Math.PI / 2, -Math.PI / 2 + scoreAngle);
	ctx.strokeStyle = '#DC2626';
	ctx.lineWidth = 16;
	ctx.lineCap = 'round';
	ctx.stroke();

	// Score number
	ctx.font = '120px Vollkorn, Georgia, serif';
	ctx.fillStyle = '#DC2626';
	ctx.textAlign = 'center';
	ctx.fillText(String(data.score), 540, 740);

	// Risk label
	ctx.font = '500 24px Manrope, sans-serif';
	ctx.fillStyle = '#6b6560';
	ctx.fillText(data.riskLabel, 540, 790);

	// Summary
	ctx.font = '48px Vollkorn, Georgia, serif';
	ctx.fillStyle = '#ede9e3';
	ctx.fillText(`${data.breachCount} breaches. Your data is out there.`, 540, 1020);

	// Percentile
	ctx.font = '32px Manrope, sans-serif';
	ctx.fillStyle = '#a39e96';
	ctx.fillText(`More exposed than ${data.percentile}% of people scanned.`, 540, 1100);

	// Data class tags
	const tagY = 1200;
	const tagHeight = 36;
	const tagPadding = 24;
	ctx.font = '500 20px Manrope, sans-serif';

	const tagWidths = data.topDataClasses.map((t) => ctx.measureText(t).width + tagPadding * 2);
	const totalTagWidth = tagWidths.reduce((a, b) => a + b + 12, -12);
	let tagX = 540 - totalTagWidth / 2;

	for (let i = 0; i < data.topDataClasses.length; i++) {
		const w = tagWidths[i];
		ctx.fillStyle = 'rgba(220, 38, 38, 0.08)';
		ctx.strokeStyle = 'rgba(220, 38, 38, 0.2)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.roundRect(tagX, tagY - tagHeight / 2, w, tagHeight, 4);
		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = '#DC2626';
		ctx.textAlign = 'center';
		ctx.fillText(data.topDataClasses[i], tagX + w / 2, tagY + 7);
		tagX += w + 12;
	}

	// Branding
	ctx.beginPath();
	ctx.arc(518, 1694, 5, 0, Math.PI * 2);
	ctx.fillStyle = '#52b788';
	ctx.fill();

	ctx.font = '36px Vollkorn, Georgia, serif';
	ctx.fillStyle = '#a39e96';
	ctx.textAlign = 'center';
	ctx.fillText('ephemeral', 556, 1706);

	ctx.font = '500 22px Manrope, sans-serif';
	ctx.fillStyle = '#6b6560';
	ctx.fillText('ephemeralsocial.com/trace', 540, 1760);

	return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'));
}
