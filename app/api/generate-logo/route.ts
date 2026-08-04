import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/google-auth";
import { getOrCreateUser, deductCredit, hasUnlimitedPlan } from "@/lib/user-service";
import { db } from "@/db";
import { generations } from "@/db/schemas/schema";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

interface LogoConfig {
  brandName: string;
  tagline: string;
  industry: string;
  style: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

function buildPrompt(config: LogoConfig): string {
  const styleMap: Record<string, string> = {
    minimalist: "minimalist, clean lines, simple iconography, lots of negative space, flat design",
    modern: "modern professional, bold typography, sleek and polished, contemporary",
    vintage: "vintage retro style, aged textures, classic typography, nostalgic feel",
    playful: "playful and fun, rounded shapes, friendly and approachable, vibrant",
    luxury: "luxury and premium, elegant, refined, sophisticated, high-end brand",
    tech: "futuristic tech style, geometric, digital, sharp edges, innovative",
    organic: "organic natural, flowing shapes, earthy, nature-inspired",
    geometric: "geometric abstract, bold shapes, structured, mathematical precision",
  };

  const styleDesc = styleMap[config.style] || config.style;
  const colorDesc = config.primaryColor && config.secondaryColor
    ? `Primary color ${config.primaryColor}, secondary color ${config.secondaryColor}`
    : "";

  let prompt = `Professional logo design for "${config.brandName}", a ${config.industry} brand. `;
  prompt += `Style: ${styleDesc}. `;
  if (config.tagline) prompt += `Tagline: "${config.tagline}". `;
  if (colorDesc) prompt += `${colorDesc}. `;
  if (config.description) prompt += `Brand description: ${config.description}. `;
  prompt += `The logo should be on a clean white background, centered, high quality, professional vector-style logo design, suitable for business use.`;

  return prompt;
}

async function generateWithGptImage(prompt: string): Promise<string> {
  const reactusBase = process.env.REACTUS_BASE_URL;
  const apiKey = process.env.BTY_LLM_SERVER_API_KEY || process.env.HAPPYSEEDS_KEY;
  const projectId = process.env.HAPPYSEEDS_PROJECT_ID || process.env.REACTUS_PROJECT_ID;

  if (!reactusBase || !apiKey) {
    throw new Error("Missing REACTUS_BASE_URL or API key environment variables");
  }

  const body = {
    model: "gpt-image-2",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "medium",
  };

  const sseResponse = await fetch(`${reactusBase}/v1/llm_server/sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "x-bty-app": projectId || "",
      "x-bty-model": "gpt-image-2-gen",
    },
    body: JSON.stringify(body),
  });

  if (!sseResponse.ok) {
    const errText = await sseResponse.text();
    throw new Error(`Image generation request failed: ${sseResponse.status} ${errText.slice(0, 200)}`);
  }

  const rawText = await sseResponse.text();

  // Parse SSE events to find the completed event
  const lines = rawText.split("\n");
  let completedData: string | null = null;
  let lastEventType = "";

  for (const line of lines) {
    if (line.startsWith("event:")) {
      lastEventType = line.slice(6).trim();
    } else if (line.startsWith("data:") && lastEventType === "llm_server.completed") {
      completedData = line.slice(5).trim();
      break;
    }
  }

  if (!completedData) {
    // Check for failed event
    let failedData = "";
    lastEventType = "";
    for (const line of lines) {
      if (line.startsWith("event:")) {
        lastEventType = line.slice(6).trim();
      } else if (line.startsWith("data:") && lastEventType === "llm_server.failed") {
        failedData = line.slice(5).trim();
        break;
      }
    }
    if (failedData) {
      throw new Error(`Generation failed: ${failedData.slice(0, 200)}`);
    }
    throw new Error("No completed event found in SSE response");
  }

  // Parse the lifecycle envelope
  const envelope = JSON.parse(completedData);
  const providerData = envelope.data;

  // Extract base64 image
  const b64 = providerData?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("No image data in provider response");
  }

  // Clean whitespace from base64
  const cleanB64 = b64.replace(/\s/g, "");
  const dataUri = `data:image/png;base64,${cleanB64}`;

  // Upload to OSS to get a persistent URL
  const uploadRes = await fetch(`${reactusBase}/v1/llm_server/upload_base64_file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      project_id: projectId,
      content: dataUri,
    }),
  });

  if (!uploadRes.ok) {
    // Fall back to returning the data URI directly
    return dataUri;
  }

  const uploadResult = await uploadRes.json();
  if (uploadResult.success && uploadResult.data) {
    return uploadResult.data as string;
  }

  return dataUri;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const sessionUser = await getSession(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Please log in to generate logos", requiresLogin: true }, { status: 401 });
    }

    // Get/create user and check credits
    const user = await getOrCreateUser({
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name ?? undefined,
      avatar_url: sessionUser.avatar_url ?? undefined,
    });

    const unlimited = await hasUnlimitedPlan(user.id);

    if (!unlimited && user.credits < 1) {
      return NextResponse.json({
        error: "You have no credits left. Please purchase a plan to continue.",
        requiresUpgrade: true,
        credits: 0,
      }, { status: 402 });
    }

    const config: LogoConfig = await req.json().catch(() => ({})) as LogoConfig;

    if (!config.brandName?.trim()) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    const availableModels = process.env.HAPPYSEEDS_AVAILABLE_MODELS || "";
    const modelAllowed =
      availableModels.includes("gpt-image-2-gen") ||
      availableModels.includes("gpt-image-2");

    if (!modelAllowed && availableModels.length > 0) {
      return NextResponse.json(
        { error: "Image generation model is not available in this environment" },
        { status: 503 }
      );
    }

    // Deduct credit (unless unlimited)
    if (!unlimited) {
      const deducted = await deductCredit(user.id);
      if (!deducted) {
        return NextResponse.json({ error: "Failed to deduct credit", requiresUpgrade: true }, { status: 402 });
      }
    }

    // Generate 2 variations with slightly different prompts
    const basePrompt = buildPrompt(config);
    const variation2Prompt = buildPrompt({ ...config, description: (config.description ? config.description + " " : "") + "Alternative creative interpretation, different icon/symbol approach." });

    const [logo1, logo2] = await Promise.allSettled([
      generateWithGptImage(basePrompt),
      generateWithGptImage(variation2Prompt),
    ]);

    const logos: Array<{ url: string; prompt: string }> = [];

    if (logo1.status === "fulfilled") {
      logos.push({ url: logo1.value, prompt: basePrompt });
    }
    if (logo2.status === "fulfilled") {
      logos.push({ url: logo2.value, prompt: variation2Prompt });
    }

    if (logos.length === 0) {
      // Refund the credit on failure
      if (!unlimited) {
        const { addCredits } = await import("@/lib/user-service");
        await addCredits(user.id, 1);
      }
      const reason = logo1.status === "rejected" ? (logo1.reason as Error)?.message : "Unknown error";
      return NextResponse.json({ error: reason || "Failed to generate logos" }, { status: 500 });
    }

    // Save generation history
    await db.insert(generations).values({
      id: randomUUID(),
      userId: user.id,
      brandName: config.brandName,
      style: config.style,
      creditsUsed: unlimited ? 0 : 1,
      imageUrls: logos.map(l => l.url),
    });

    const remainingCredits = unlimited ? -1 : user.credits - 1;

    return NextResponse.json({ logos, credits: remainingCredits });
  } catch (err: unknown) {
    console.error("Logo generation error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
