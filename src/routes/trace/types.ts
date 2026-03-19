export interface Breach {
	name: string;
	title: string;
	domain: string;
	date: string;
	addedDate: string;
	count: number;
	dataClasses: string[];
	description: string;
	isVerified: boolean;
	isSensitive: boolean;
	logoPath: string;
}

export interface ScanResult {
	breaches: Breach[];
	count: number;
	emailBreaches: number;
	phoneBreaches: number;
}
