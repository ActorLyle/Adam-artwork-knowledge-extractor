"use client";

import { useEffect, useRef, useState } from "react";
import { AnalysisResult } from "@/components/AnalysisResult";
import { HookBanner } from "@/components/HookBanner";
import { UploadZone } from "@/components/UploadZone";
import { IconSparkles } from "@/components/Icons";
import { SAMPLE_ARTWORKS } from "@/lib/samples";
import type { AnalysisData, AnalysisResultData, ArtworkSample, LocalImage } from "@/lib/types";

function formatFileSize(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function imageToBase64(src: string): Promise<{ imageBase64: string; mimeType: "image/jpeg" }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const maxEdge = 2048;
      const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("浏览器无法处理这张图片，请重新选择后重试。"));
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve({ imageBase64: dataUrl.slice(dataUrl.indexOf(",") + 1), mimeType: "image/jpeg" });
      } catch {
        reject(new Error("图片转换失败，请尝试另存为 JPG 或 PNG 后重试。"));
      }
    };
    image.onerror = () => reject(new Error("无法读取图片，请重新选择 JPG 或 PNG 文件。"));
    image.src = src;
  });
}

function isAnalysisData(value: unknown): value is AnalysisData {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Partial<AnalysisData>;
  return Array.isArray(data.knowledgePoints)
    && data.knowledgePoints.length > 0
    && data.knowledgePoints.every((point) => point && [point.title, point.evidence, point.examPoint, point.practice].every((text) => typeof text === "string"))
    && Boolean(data.note)
    && typeof data.note?.title === "string"
    && typeof data.note?.content === "string"
    && Array.isArray(data.note?.tags)
    && data.note.tags.every((tag) => typeof tag === "string")
    && typeof data.hook === "string";
}

export default function HomePage() {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [result, setResult] = useState<AnalysisResultData | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [toast, setToast] = useState("");
  const requestSequence = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);

  const canAnalyze = Boolean(image) && !isGenerating;
  const activeResult = result;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (image?.kind !== "upload") return;
    return () => URL.revokeObjectURL(image.src);
  }, [image]);

  const resetResult = () => {
    requestSequence.current += 1;
    activeRequest.current?.abort();
    activeRequest.current = null;
    setIsGenerating(false);
    setResult(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteTags([]);
    setAnalysisError("");
  };

  const handleFileSelect = (file: File) => {
    const src = URL.createObjectURL(file);
    resetResult();
    setImage({ src, name: file.name, sizeLabel: `${formatFileSize(file.size)} · 本地文件`, kind: "upload" });
  };

  const handleSampleSelect = (sample: ArtworkSample) => {
    resetResult();
    setImage({
      src: sample.src,
      name: sample.imageName,
      sizeLabel: "内置案例 · 示例图片",
      kind: "sample",
    });
  };

  const useResult = (next: AnalysisResultData) => {
    setResult(next);
    setNoteTitle(next.note.title);
    setNoteContent(next.note.content);
    setNoteTags(next.note.tags);
  };

  const handleAnalyze = async (scrollToResults = true) => {
    if (!image || isGenerating) return;
    const requestId = ++requestSequence.current;
    const controller = new AbortController();
    activeRequest.current = controller;
    setIsGenerating(true);
    setAnalysisError("");
    try {
      const encodedImage = await imageToBase64(image.src);
      if (requestId !== requestSequence.current) return;
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encodedImage),
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (typeof payload !== "object" || payload === null) {
        throw new Error(response.ok ? "分析服务返回了无效内容，请重试。" : `分析请求失败（HTTP ${response.status}），请稍后重试。`);
      }
      const body = payload as { ok?: unknown; msg?: unknown; data?: unknown };
      if (!response.ok || body.ok !== true) {
        throw new Error(typeof body.msg === "string" ? body.msg : `分析请求失败（HTTP ${response.status}），请稍后重试。`);
      }
      if (!isAnalysisData(body.data)) throw new Error("模型返回的数据结构不完整，请重试。 ");
      if (requestId !== requestSequence.current) return;

      useResult({ ...body.data, id: `analysis-${Date.now()}`, imageName: image.name });
      if (scrollToResults) {
        window.setTimeout(() => document.getElementById("results-title")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      }
    } catch (error) {
      if (requestId !== requestSequence.current) return;
      const message = error instanceof TypeError
        ? "无法连接分析服务。请确认网络正常、开发服务器正在运行后重试。"
        : error instanceof Error
          ? error.message
          : "分析失败，请稍后重试。";
      setAnalysisError(message);
    } finally {
      if (requestId === requestSequence.current) {
        activeRequest.current = null;
        setIsGenerating(false);
      }
    }
  };

  const copyText = async (text: string, label = "已复制到剪贴板") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setToast(label);
  };

  const copyFullNote = () => {
    const fullNote = [noteTitle, noteContent, noteTags.join(" ")].filter(Boolean).join("\n\n");
    void copyText(fullNote, "笔记全文已复制");
  };

  const copyHook = () => {
    const hook = activeResult?.hook ?? "想要完整版范画和高清步骤图？私信我，24 小时内发你。";
    void copyText(hook, "私信话术已复制");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a href="#top" className="brand-lockup" aria-label="亚当设计教育首页">
          <span className="brand-monogram">A<span>.</span></span>
          <span className="brand-name">ADAM <span>DESIGN EDUCATION</span></span>
        </a>
        <div className="topbar-right"><span className="topbar-label">运营工具 · 模型 API 模式</span><span className="topbar-separator" /><span className="edition-dot" />MODEL API</div>
      </header>

      <div id="top" className="page-content">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow"><span className="hero-kicker-line" /> THE ARTWORK EDITORIAL DESK</span>
            <h1>亚当范画<span>知识提取器</span></h1>
            <p className="hero-subtitle">上传遮挡版范画，自动提取考点并生成小红书笔记</p>
            <p className="hero-note"><span>NOTE</span> 本工具仅辅助运营，不替代专业教学判断。</p>
          </div>
          <div className="hero-side" aria-hidden="true">
            <div className="hero-stamp"><span>ADAM</span><span>STUDIO</span><span>· 2026 ·</span></div>
            <span className="hero-cross cross-one">+</span><span className="hero-cross cross-two">+</span>
          </div>
        </section>

        <div className="workspace-label"><span className="workspace-label-text">WORKSPACE</span><span className="workspace-line" /><span className="workspace-time">CONTENT PREP / 01</span></div>

        <section className="input-grid" aria-label="上传范画并生成内容">
          <UploadZone image={image} examples={SAMPLE_ARTWORKS} onFileSelect={handleFileSelect} onSampleSelect={handleSampleSelect} onClear={() => { setImage(null); resetResult(); }} />
          <section className="panel run-panel" aria-labelledby="run-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">READY WHEN YOU ARE</span>
                <h2 id="run-title">从局部开始拆解</h2>
              </div>
              <span className="run-index">A—01</span>
            </div>
            <p className="run-description">上传老师的范画照片，提取可见线索，整理成考点解析与发布草稿。</p>
            <div className="run-steps">
              <div><span>1</span><p>上传局部范画<span>支持遮挡、裁剪和打码</span></p></div>
              <div><span>2</span><p>发送至视觉模型<span>图片经本地代理安全转发</span></p></div>
              <div><span>3</span><p>人工核对后发布<span>按需编辑并复制到小红书</span></p></div>
            </div>
            <button className="button button-primary analyze-button" onClick={() => void handleAnalyze()} disabled={!canAnalyze}>
              {isGenerating ? <span className="loading-spinner" /> : <IconSparkles />}
              {isGenerating ? "正在分析画面…" : "开始识别并生成"}
              {!isGenerating && <span className="button-arrow">↗</span>}
            </button>
            <p className="local-note"><span className="local-lock">⌑</span> 图片经本地代理转发至所选模型服务，仅用于本次分析</p>
            {!image && <p className="select-prompt">先添加一张范画，按钮就会亮起</p>}
          </section>
        </section>

        {analysisError && <div className="analysis-error" role="alert"><span className="error-mark">!</span><span>{analysisError}</span><button onClick={() => void handleAnalyze()} disabled={!image || isGenerating}>重试</button></div>}

        {activeResult ? (
          <>
            <AnalysisResult result={activeResult} title={noteTitle} content={noteContent} tags={noteTags} onTitleChange={setNoteTitle} onContentChange={setNoteContent} onCopy={copyText} onCopyAll={copyFullNote} onRegenerate={() => void handleAnalyze(false)} isGenerating={isGenerating} />
            <HookBanner hook={activeResult.hook} onCopy={copyHook} />
          </>
        ) : (
          <section className="empty-results" aria-label="结果预览提示">
            <span className="empty-results-number">02</span>
            <div><span className="eyebrow">NEXT, THE GOOD PART</span><p>模型分析完成后，考点卡片与笔记草稿会出现在这里。</p></div>
            <span className="empty-results-arrow">↓</span>
          </section>
        )}

        <footer className="page-footer"><span>© ADAM DESIGN EDUCATION</span><span>MADE FOR THE NEXT GREAT IDEA</span><span>MODEL API · V1.0</span></footer>
      </div>

      {toast && <div className="toast" role="status"><span className="toast-check">✓</span>{toast}</div>}
    </main>
  );
}
