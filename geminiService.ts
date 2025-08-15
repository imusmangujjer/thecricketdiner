import type { PodcastConfig, MatchData, TranscriptMessage, Speaker } from "../types";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
if (!API_KEY) throw new Error("Missing VITE_GEMINI_API_KEY in .env");

const PREFERRED_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-1.5-flash";
const FALLBACK_MODELS = ["gemini-1.5-flash-8b", "gemini-1.5-pro"];

const genAI = new GoogleGenerativeAI(API_KEY);

const getModel = (names: string[]) => genAI.getGenerativeModel({ model: names[0] });
const stripFences = (s: string) => s.replace(/^\s*```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();

const tryModelsJSON = async (names: string[], prompt: string, schema?: any) => {
  let lastErr: unknown;
  for (const name of names) {
    try {
      const model = genAI.getGenerativeModel({
        model: name,
        generationConfig: schema
          ? { responseMimeType: "application/json", responseSchema: schema }
          : undefined,
      });
      const res = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
      const text = stripFences(res.response.text());
      return text;
    } catch (e) {
      lastErr = e;
      console.warn(`Model ${name} failed, trying next…`, e);
    }
  }
  throw lastErr ?? new Error("All model attempts failed");
};

/** ---------------- Recent Matches ---------------- */
const fetchRecentMatches = async (count: number = 7): Promise<MatchData[]> => {
  const prompt = `
Generate ${count} recent, completed, high-profile international cricket matches (Test, O-D-I, or T-Twenty-I) from the last two months.
Return ONLY a JSON array; each object must include:
- id (slug like "ind-vs-aus-1st-t20i-2025")
- matchTitle
- venue
- result
- scoreSummary
- topPerformers (array of strings)
`;

  const schema = {
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING },
        matchTitle: { type: SchemaType.STRING },
        venue: { type: SchemaType.STRING },
        result: { type: SchemaType.STRING },
        scoreSummary: { type: SchemaType.STRING },
        topPerformers: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ["id", "matchTitle", "venue", "result", "scoreSummary", "topPerformers"],
    },
  };

  try {
    const jsonStr = await tryModelsJSON([PREFERRED_MODEL, ...FALLBACK_MODELS], prompt, schema);
    return JSON.parse(jsonStr) as MatchData[];
  } catch (err) {
    console.error("Error fetching recent matches:", err);
    // Small fallback so UI remains interactive
    const fallback: MatchData[] = [
      {
        id: "ind-vs-aus-1st-t20i-2025",
        matchTitle: "India vs Australia, 1st T-Twenty-I",
        venue: "Nagpur — VCA Stadium",
        result: "India won by 6 wickets",
        scoreSummary: "AUS 175/8 (20), IND 176/4 (19.2)",
        topPerformers: ["Virat Kohli: 82* (53)", "Jasprit Bumrah: 2/26 (4)"],
      },
    ];
    return fallback;
  }
};

/** ---------------- Podcast Script ---------------- */
const generatePodcastScript = async (
  config: PodcastConfig,
  topic: string,
  allSpeakers: Speaker[],
  matches: MatchData[] | null
): Promise<TranscriptMessage[]> => {
  const personas = [
    "The thoughtful, analytical anchor who keeps the conversation on track.",
    "The excitable, passionate commentator who reacts emotionally to big moments.",
    "The cynical ex-player who is hard to impress and focuses on technical flaws.",
    "The optimistic fan-turned-pundit who always sees the bright side.",
    "The data-driven analyst who loves obscure stats and trends.",
    "The host who loves to stir the pot and ask controversial questions.",
  ];

  const speakerProfiles = allSpeakers
    .map((s, i) => {
      const role = config.hosts.some((h) => h.id === s.id && h.name === s.name) ? "Host" : "Guest";
      return `${s.name} (${role}): ${personas[i % personas.length]}`;
    })
    .join("\n");

  const topicInstruction =
    matches && matches.length
      ? `**Podcast Topic:** Deep analysis of the following recent matches:
${matches.map((m) => `- **Match:** ${m.matchTitle}\n  - **Result:** ${m.result}`).join("\n")}`
      : `**Podcast Topic:** A deep-dive discussion on "${topic}". Explore viewpoints, context, key players, and current trends.`;

  const statBotInstruction = config.includeStatBot
    ? "Include 'AI StatBot' ~5–6 times. Its lines MUST be speaker 'AI StatBot' with ONLY the statistic/fact."
    : "No AI StatBot in this episode.";

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const prompt = `
You are an expert cricket podcast script generator for "The Cricket Diner".

${topicInstruction}

**Participants & Personas**
${speakerProfiles}
- Announcer: voice for teasers and breaks.

**Tone:** ${config.tone}

**Structure (7 acts)**
1) Intro by a host (welcome, introduce all speakers, state topic).
2) Main Discussion 1 (~8–10 lines). A host announces a break at the end.
3) BREAK (speaker "BREAK"): list 2–3 upcoming *international* matches after ${today} with date/time in EST. Start with an emotion cue in [].
4) Main Discussion 2 (~8–10 lines). A host announces a break at the end.
5) Second BREAK (same rules; different matches if possible).
6) Closing remarks: host asks each guest for final opinion; each responds.
7) Outro + Teaser: host thanks all; 'Announcer' gives a teaser for a fictional next episode.

**Dialogue Rules**
- EVERY line begins with an emotion cue in square brackets (e.g., [excited], [analytical], [skeptical], [chuckling], [thoughtful]).
- Keep personas consistent; use pauses "...", reactions, and banter.
- Use phonetics: "T-Twenty-I", "O-D-I".
- Weave in match analysis: top performers, turning points, tactics.

**AI StatBot**
${statBotInstruction}

**Output:**
Return ONLY a JSON array of objects:
{ "speaker": string, "line": string }
"line" MUST begin with the emotion cue.
`;

  const schema = {
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        speaker: { type: SchemaType.STRING },
        line: { type: SchemaType.STRING },
      },
      required: ["speaker", "line"],
    },
  };

  const jsonStr = await tryModelsJSON([PREFERRED_MODEL, ...FALLBACK_MODELS], prompt, schema);
  return JSON.parse(jsonStr) as TranscriptMessage[];
};

/** ---------------- Topic Suggestions ---------------- */
const generateTopicSuggestions = async (count: number = 5): Promise<string[]> => {
  const prompt = `
Generate ${count} fresh, topical cricket podcast titles.
Use phonetics for terms: "T-Twenty-I".
Return ONLY a JSON array of strings.
`;

  const schema = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } };
  const jsonStr = await tryModelsJSON([PREFERRED_MODEL, ...FALLBACK_MODELS], prompt, schema);
  return JSON.parse(jsonStr) as string[];
};

/** ---------------- Summary ---------------- */
const generatePodcastSummary = async (transcript: TranscriptMessage[]): Promise<string> => {
  const clean = (line: string) => line.replace(/^\[(.*?)\]\s*/, "");
  const full = transcript
    .filter((t) => !/break|announcer/i.test(t.speaker))
    .map((t) => `${t.speaker}: ${clean(t.line)}`)
    .join("\n");

  const prompt = `
Summarize the following "The Cricket Diner" transcript into a concise, well-structured text:
- Heading first
- Bullets or short paragraphs
- Highlight key stats
- Capture final/differing opinions

Transcript:
${full}
`;

  const text = await tryModelsJSON([PREFERRED_MODEL, ...FALLBACK_MODELS], prompt);
  return stripFences(text);
};

export const geminiService = {
  fetchRecentMatches,
  generatePodcastScript,
  generateTopicSuggestions,
  generatePodcastSummary,
};
