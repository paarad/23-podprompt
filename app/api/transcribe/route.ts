import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
		const contentType = request.headers.get("content-type") || "";

		if (contentType.includes("multipart/form-data")) {
			const formData = await request.formData();
			const urlValue = formData.get("url");
			let file: File | null = formData.get("file") as unknown as File | null;

			if (!file && urlValue && typeof urlValue === "string") {
				// Try to fetch the remote file (must be a direct audio URL)
				const res = await fetch(urlValue);
				if (!res.ok) {
					return NextResponse.json({ error: "Failed to fetch audio URL" }, { status: 400 });
				}
				const blob = await res.blob();
				file = new File([await blob.arrayBuffer()], "audio-from-url", { type: blob.type || "audio/mpeg" });
			}

			if (!file) {
				return NextResponse.json({ error: "No audio file or valid URL provided" }, { status: 400 });
			}

			const transcription = await openai.audio.transcriptions.create({
				file,
				model: "whisper-1",
				response_format: "json",
				temperature: 0.2,
			});

			const transcriptText = (transcription as { text?: string }).text ?? "";
			return NextResponse.json({ transcript: transcriptText });
		}

		// If JSON body was sent (alternative usage)
		const { url } = await request.json().catch(() => ({ url: undefined as string | undefined }));
		if (url && typeof url === "string") {
			const res = await fetch(url);
			if (!res.ok) {
				return NextResponse.json({ error: "Failed to fetch audio URL" }, { status: 400 });
			}
			const blob = await res.blob();
			const file = new File([await blob.arrayBuffer()], "audio-from-url", { type: blob.type || "audio/mpeg" });
			const transcription = await openai.audio.transcriptions.create({
				file,
				model: "whisper-1",
				response_format: "json",
				temperature: 0.2,
			});
			const transcriptText = (transcription as { text?: string }).text ?? "";
			return NextResponse.json({ transcript: transcriptText });
		}

		return NextResponse.json({ error: "Unsupported content type or missing inputs" }, { status: 400 });
	} catch (error: unknown) {
		console.error("/api/transcribe error", error);
		const message = error instanceof Error ? error.message : "Internal Server Error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
} 