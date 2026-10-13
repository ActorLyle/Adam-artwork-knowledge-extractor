"use client";

import type { AnalysisResultData } from "@/lib/types";
import { IconCopy, IconSparkles } from "@/components/Icons";
import { NotePreview } from "@/components/NotePreview";

interface AnalysisResultProps {
  result: AnalysisResultData;
  title: string;
  content: string;
  tags: string[];
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCopy: (text: string, label?: string) => void;
  onCopyAll: () => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export function AnalysisResult({ result, title, content, tags, onTitleChange, onContentChange, onCopy, onCopyAll, onRegenerate, isGenerating }: AnalysisResultProps) {
  return (
    <section className="results-section" aria-labelledby="results-title">
      <div className="results-title-row">
        <div>
          <span className="eyebrow">03 / MODEL ANALYSIS</span>
          <h2 id="results-title">可见线索，变成发布内容。</h2>
        </div>
        <div className="model-status"><span className="status-dot" />视觉模型已完成分析 <span className="status-divider">·</span> 发布前请人工核对</div>
      </div>

      <div className="results-grid">
        <section className="panel knowledge-panel" aria-labelledby="knowledge-title">
          <div className="section-heading knowledge-heading">
            <div>
              <span className="eyebrow">VISIBLE DETAILS</span>
              <h3 id="knowledge-title">画面可见知识点</h3>
            </div>
            <span className="count-pill">{String(result.knowledgePoints.length).padStart(2, "0")} 条线索</span>
          </div>

          <div className="knowledge-list">
            {result.knowledgePoints.map((point, index) => (
              <article className="knowledge-card" key={`${result.id}-${point.title}`}>
                <div className="knowledge-card-top">
                  <span className="knowledge-index">0{index + 1}</span>
                  <h4>{point.title}</h4>
                  <button className="icon-button" onClick={() => onCopy(`${point.title}\n画面依据：${point.evidence}\n考点解析：${point.examPoint}\n练习建议：${point.practice}`, "知识点已复制")} aria-label={`复制${point.title}`} title="复制知识点"><IconCopy /></button>
                </div>
                <div className="knowledge-details">
                  <p><span>画面依据</span>{point.evidence}</p>
                  <p><span>考点解析</span>{point.examPoint}</p>
                  <p><span>练习建议</span>{point.practice}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="reasoning-note"><IconSparkles /><span>基于当前可见局部推演，未对遮挡区域作事实判断。</span></div>
        </section>

        <NotePreview result={result} title={title} content={content} tags={tags} onTitleChange={onTitleChange} onContentChange={onContentChange} onTagsCopy={(tag) => onCopy(tag, `${tag} 已复制`)} onCopyAll={onCopyAll} onRegenerate={onRegenerate} isGenerating={isGenerating} />
      </div>
    </section>
  );
}
