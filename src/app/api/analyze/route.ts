import { NextResponse } from "next/server";
import type { AnalysisData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const SYSTEM_PROMPT = `你是一名美术考研阅卷老师，同时也是一名营销策划。用户提供的图片是一张故意遮挡/裁剪的考研范画（商业保护策略）。你绝不能因为图片不完整而拒绝分析。请基于能看到的局部画面，推演并提取核心亮点。

输出严格 JSON 格式：
{
  "knowledgePoints": [
    { "title": "知识点标题", "evidence": "画面可见的局部依据", "examPoint": "考研考点解析", "practice": "建议怎么练" }
  ],
  "note": {
    "title": "小红书标题（15-25字，有钩子）",
    "content": "小红书正文（400-600字，口语化，有互动）",
    "tags": ["#艺术考研", "#视传考研", "..."]
  },
  "hook": "想要完整版范画和高清步骤图？私信我，24小时内发你。"
}

限制：不要输出任何解释性文字，只输出纯 JSON。禁止说“图片不清晰”、“无法判断”。必须基于局部强行推演，哪怕需要合理盲猜。`;

type Provider = "ark" | "zhipu";

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

function jsonError(msg: string, status: number) {
  return NextResponse.json({ ok: false, msg }, { status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readProvider(): { provider: Provider; apiKey: string; model: string; endpoint: string } | { error: string } {
  const requested = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (requested && requested !== "ark" && requested !== "zhipu") {
    return { error: "AI_PROVIDER 只支持 ark 或 zhipu，请检查 .env.local。" };
  }
  const provider = (requested || (process.env.ARK_API_KEY ? "ark" : process.env.ZHIPU_API_KEY ? "zhipu" : "")) as Provider | "";

  if (provider !== "ark" && provider !== "zhipu") {
    return { error: "服务端尚未配置模型 API Key。请在 .env.local 中配置 ARK_API_KEY 或 ZHIPU_API_KEY，并设置 AI_PROVIDER。" };
  }

  if (provider === "ark") {
    const apiKey = process.env.ARK_API_KEY?.trim();
    const model = process.env.ARK_MODEL?.trim();
    if (!apiKey) return { error: "已选择火山引擎方舟，但服务端缺少 ARK_API_KEY。请检查 .env.local。" };
    if (!model) return { error: "请在 .env.local 中设置 ARK_MODEL 为已开通的方舟推理接入点 ID（ep-...）。" };
    return {
      provider,
      apiKey,
      model,
      endpoint: process.env.ARK_API_URL?.trim() || "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    };
  }

  const apiKey = process.env.ZHIPU_API_KEY?.trim();
  if (!apiKey) return { error: "已选择智谱 GLM，但服务端缺少 ZHIPU_API_KEY。请检查 .env.local。" };
  return {
    provider,
    apiKey,
    model: process.env.ZHIPU_MODEL?.trim() || "glm-4v",
    endpoint: process.env.ZHIPU_API_URL?.trim() || "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  };
}

function validateImage(imageBase64: unknown, mimeType: unknown): { base64: string; mimeType: "image/jpeg" | "image/png"; bytes: Buffer } | { error: string } {
  if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
    return { error: "请求中缺少图片 Base64 数据。" };
  }

  let base64 = imageBase64;
  let resolvedMime = mimeType;
  const dataUrl = imageBase64.match(/^data:(image\/(?:jpeg|png));base64,([\s\S]+)$/i);
  if (dataUrl) {
    resolvedMime = dataUrl[1].toLowerCase();
    base64 = dataUrl[2];
  }

  if (resolvedMime !== "image/jpeg" && resolvedMime !== "image/png") {
    return { error: "图片格式仅支持 JPEG 或 PNG。" };
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) {
    return { error: "图片 Base64 数据格式无效。" };
  }

  const bytes = Buffer.from(base64, "base64");
  if (bytes.length === 0) return { error: "图片内容为空，请重新选择图片。" };
  if (bytes.length > MAX_IMAGE_BYTES) return { error: "图片压缩后仍超过 12 MB，请换一张较小的图片。" };

  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if ((resolvedMime === "image/jpeg" && !isJpeg) || (resolvedMime === "image/png" && !isPng)) {
    return { error: "图片内容与声明的格式不匹配，请重新选择 JPG 或 PNG 图片。" };
  }

  return { base64, mimeType: resolvedMime, bytes };
}

function getMessageText(response: ChatCompletionResponse): string {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((part) => part.text || "").join("\n").trim();
  return "";
}

function parseAnalysisData(raw: string): AnalysisData {
  const unwrapped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed: unknown = JSON.parse(unwrapped);
  if (!isObject(parsed) || !Array.isArray(parsed.knowledgePoints) || !isObject(parsed.note)) {
    throw new Error("模型返回的数据结构不完整。请重试。 ");
  }

  const knowledgePoints = parsed.knowledgePoints.map((item, index) => {
    if (!isObject(item)) throw new Error(`第 ${index + 1} 条知识点格式无效，请重试。`);
    const fields = [item.title, item.evidence, item.examPoint, item.practice];
    if (fields.some((field) => typeof field !== "string" || !field.trim())) {
      throw new Error(`第 ${index + 1} 条知识点缺少内容，请重试。`);
    }
    return {
      title: (item.title as string).trim(),
      evidence: (item.evidence as string).trim(),
      examPoint: (item.examPoint as string).trim(),
      practice: (item.practice as string).trim(),
    };
  });

  const { note } = parsed;
  if (typeof note.title !== "string" || !note.title.trim() || typeof note.content !== "string" || !note.content.trim() || !Array.isArray(note.tags)) {
    throw new Error("模型返回的笔记内容不完整。请重试。 ");
  }
  if (typeof parsed.hook !== "string" || !parsed.hook.trim()) {
    throw new Error("模型没有返回私信引导文案。请重试。 ");
  }

  const tags = note.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => {
    const trimmed = tag.trim();
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  }).filter((tag) => tag.length > 1);
  if (knowledgePoints.length === 0 || tags.length === 0) throw new Error("模型返回的知识点或标签为空。请重试。 ");

  return {
    knowledgePoints,
    note: { title: note.title.trim(), content: note.content.trim(), tags },
    hook: parsed.hook.trim(),
  };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 18 * 1024 * 1024) return jsonError("请求图片过大，请压缩后重试。", 413);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("请求内容不是有效的 JSON。", 400);
  }
  if (!isObject(body)) return jsonError("请求格式无效。", 400);

  const image = validateImage(body.imageBase64, body.mimeType);
  if ("error" in image) return jsonError(image.error, 400);

  const config = readProvider();
  if ("error" in config) return jsonError(config.error, 503);

  try {
    const upstream = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.6,
        max_tokens: 3000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "请分析这张考研范画，按要求只返回结构化 JSON。" },
              { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(100_000),
    });

    if (!upstream.ok) {
      console.error(`[analyze] ${config.provider} upstream returned HTTP ${upstream.status}`);
      const detail = upstream.status === 401 || upstream.status === 403
        ? "模型服务认证失败，请检查 API Key 和模型权限。"
        : upstream.status === 429
          ? "模型服务当前请求过多或额度不足，请稍后重试并检查账户额度。"
          : `模型服务请求失败（HTTP ${upstream.status}），请检查模型名称、服务配置后重试。`;
      return jsonError(detail, 502);
    }

    const completion = await upstream.json() as ChatCompletionResponse;
    const message = getMessageText(completion);
    if (!message) {
      console.error(`[analyze] ${config.provider} returned an empty completion`);
      return jsonError("模型没有返回可读取的内容，请重试。", 502);
    }

    try {
      const data = parseAnalysisData(message);
      return NextResponse.json({ ok: true, data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "模型返回内容无法解析，请重试。";
      console.error(`[analyze] ${config.provider} response validation failed`);
      return jsonError(msg, 502);
    }
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error(`[analyze] ${config.provider} request ${timedOut ? "timed out" : "failed"}`);
    return jsonError(timedOut ? "模型分析超时，请稍后重试。" : "连接模型服务失败，请检查网络或稍后重试。", timedOut ? 504 : 502);
  }
}
