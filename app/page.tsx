"use client";

import { useState } from "react";

type SummaryPayload = {
	keyPoints: string[];
	highlights: string[];
	timestampedNotes: { timestamp: string; note: string }[];
	tweetThread: string[];
	promoCaptions: string[];
	seoTitles: string[];
};

export default function Home() {
	const [file, setFile] = useState<File | null>(null);
	const [url, setUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [transcript, setTranscript] = useState("");
	const [result, setResult] = useState<SummaryPayload | null>(null);

	async function handleProcess() {
		setLoading(true);
		setError(null);
		setResult(null);

		try {
			const formData = new FormData();
			if (file) formData.append("file", file);
			if (url.trim()) formData.append("url", url.trim());

			if (!file && !url.trim()) {
				setError("Please provide an audio file or a direct audio URL.");
				setLoading(false);
				return;
			}

			const transcribeRes = await fetch("/api/transcribe", {
				method: "POST",
				body: formData,
			});
			const transcribeData = (await transcribeRes.json()) as { transcript?: string; error?: string };
			if (!transcribeRes.ok) throw new Error(transcribeData?.error || "Transcription failed");

			const text: string = transcribeData.transcript || "";
			setTranscript(text);

			const summarizeRes = await fetch("/api/summarize", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ transcript: text }),
			});
			const summaryData = (await summarizeRes.json()) as SummaryPayload & { error?: string };
			if (!summarizeRes.ok) throw new Error(summaryData?.error || "Summarization failed");

			setResult(summaryData as SummaryPayload);
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Something went wrong";
			setError(message);
		} finally {
			setLoading(false);
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).catch(() => {});
	}

	return (
		<div className="font-sans min-h-screen p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-8">
			<section className="pt-8 sm:pt-16 pb-2 sm:pb-4 text-center">
				<h1 className="text-4xl sm:text-6xl font-bold tracking-tight">PodPrompt</h1>
				<p className="mt-3 text-sm sm:text-base opacity-80">Break down podcasts into summaries, highlights, and social-ready content.</p>
			</section>

			<section className="rounded-2xl border border-black/10 dark:border-white/10 p-3 sm:p-4 bg-white dark:bg-black/20">
				<div className="flex flex-col gap-2">
					<div className="flex items-stretch gap-2">
						<input
							type="url"
							placeholder="Paste a direct audio URL (mp3, m4a)"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							className="flex-1 rounded-md border border-black/10 dark:border-white/15 p-2 text-sm"
						/>
						<input id="file-input" type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
						<label htmlFor="file-input" className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-2 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/10">Upload</label>
						<button
							onClick={handleProcess}
							disabled={loading}
							className="inline-flex items-center rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm disabled:opacity-60"
						>
							{loading ? "Processing..." : "Go"}
						</button>
					</div>
					{file && <div className="text-xs opacity-70">Selected: {file.name}</div>}
					{error && <span className="text-sm text-red-600">{error}</span>}
				</div>
			</section>

			{transcript && (
				<section className="rounded-xl border border-black/10 dark:border-white/10 p-4 sm:p-6 bg-white dark:bg-black/20">
					<div className="flex items-center justify-between mb-3">
						<h3 className="font-medium">Transcript</h3>
						<button
							onClick={() => copyToClipboard(transcript)}
							className="text-xs underline opacity-80"
						>
							Copy
						</button>
					</div>
					<p className="text-sm whitespace-pre-wrap opacity-90 max-h-48 overflow-auto">{transcript}</p>
				</section>
			)}

			{result && (
				<section className="rounded-xl border border-black/10 dark:border-white/10 p-4 sm:p-6 bg-white dark:bg-black/20">
					<h3 className="font-medium mb-4">Results</h3>

					<div className="grid gap-6">
						<div>
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-medium">Key Points</h4>
								<button className="text-xs underline opacity-80" onClick={() => copyToClipboard(result.keyPoints.join("\n"))}>Copy</button>
							</div>
							<ul className="list-disc pl-5 text-sm space-y-1">
								{result.keyPoints.map((p, i) => (
									<li key={i}>{p}</li>
								))}
							</ul>
						</div>

						<div>
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-medium">Highlights</h4>
								<button className="text-xs underline opacity-80" onClick={() => copyToClipboard(result.highlights.join("\n"))}>Copy</button>
							</div>
							<ul className="list-disc pl-5 text-sm space-y-1">
								{result.highlights.map((p, i) => (
									<li key={i}>{p}</li>
								))}
							</ul>
						</div>

						<div>
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-medium">Tweet Thread</h4>
								<button className="text-xs underline opacity-80" onClick={() => copyToClipboard(result.tweetThread.join("\n\n"))}>Copy</button>
							</div>
							<ol className="list-decimal pl-5 text-sm space-y-1">
								{result.tweetThread.map((p, i) => (
									<li key={i}>{p}</li>
								))}
							</ol>
						</div>

						<div>
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-medium">Promo Captions</h4>
								<button className="text-xs underline opacity-80" onClick={() => copyToClipboard(result.promoCaptions.join("\n"))}>Copy</button>
							</div>
							<ul className="list-disc pl-5 text-sm space-y-1">
								{result.promoCaptions.map((p, i) => (
									<li key={i}>{p}</li>
								))}
							</ul>
						</div>

						<div>
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-medium">SEO Titles</h4>
								<button className="text-xs underline opacity-80" onClick={() => copyToClipboard(result.seoTitles.join("\n"))}>Copy</button>
							</div>
							<ul className="list-disc pl-5 text-sm space-y-1">
								{result.seoTitles.map((p, i) => (
									<li key={i}>{p}</li>
								))}
							</ul>
						</div>

						<div>
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-medium">Timestamped Notes</h4>
								<button className="text-xs underline opacity-80" onClick={() => copyToClipboard(result.timestampedNotes.map(n => `${n.timestamp} — ${n.note}`).join("\n"))}>Copy</button>
							</div>
							<ul className="list-disc pl-5 text-sm space-y-1">
								{result.timestampedNotes.map((n, i) => (
									<li key={i}><span className="font-mono text-xs mr-2 opacity-70">[{n.timestamp}]</span>{n.note}</li>
								))}
							</ul>
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
