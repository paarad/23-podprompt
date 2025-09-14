import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type SummaryPayload = {
	keyPoints: string[];
	highlights: string[];
	timestampedNotes: { timestamp: string; note: string }[];
	tweetThread: string[];
	promoCaptions: string[];
	seoTitles: string[];
};

export async function POST(request: Request) {
	try {
		const { transcript } = await request.json();
		if (!transcript || typeof transcript !== "string") {
			return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
		}

		const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

		const system = `You are an expert content producer. Given a podcast transcript, produce concise, actionable, and engaging outputs as strict JSON. Keep language clear and skimmable.`;
		const user = `Transcript:\n\n${transcript}\n\nReturn ONLY a JSON object with keys: {"keyPoints": string[], "highlights": string[], "timestampedNotes": {"timestamp": string, "note": string}[], "tweetThread": string[], "promoCaptions": string[], "seoTitles": string[]}. Each array must contain 4-10 items. If timestamps are unavailable, infer approximate mm:ss. No markdown, no extra commentary.`;

		const completion = await openai.chat.completions.create({
			model: "gpt-4o",
			response_format: { type: "json_object" },
			messages: [
				{ role: "system", content: system },
				{ role: "user", content: user },
			],
			temperature: 0.5,
		});

		const content = completion.choices?.[0]?.message?.content || "{}";
		let parsed: SummaryPayload;
		try {
			parsed = JSON.parse(content) as SummaryPayload;
		} catch {
			parsed = { keyPoints: [], highlights: [], timestampedNotes: [], tweetThread: [], promoCaptions: [], seoTitles: [] };
		}

		return NextResponse.json(parsed);
	} catch (error: unknown) {
		console.error("/api/summarize error", error);
		const message = error instanceof Error ? error.message : "Internal Server Error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
} 