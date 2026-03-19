export interface SurveyQuestion {
	question_id: string;
	event_id: string;
	question_text: string;
	question_type: 'short_answer' | 'dropdown';
	required: boolean;
	options: { choices: string[]; is_multi_select: boolean } | null;
	position: number;
}

export interface SurveyResponse {
	question_id: string;
	response_text: string | null;
	selected_options: string[] | null;
}

export interface ResponsePayload {
	question_id: string;
	response_text?: string | null;
	selected_options?: string[] | null;
}
