"use client";

import { IconCopy, IconRefresh } from "@/components/Icons";
import { TagList } from "@/components/TagList";
import type { AnalysisResultData } from "@/lib/types";

interface NotePreviewProps {
  result: AnalysisResultData;
  title: string;
  content: string;
  tags: string[];
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onTagsCopy: (tag: string) => void;
  onCopyAll: () => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export function NotePreview({ result, title, content, tags, onTitleChange, onContentChange, onTagsCopy, onCopyAll, onRegenerate, isGenerating }: NotePreviewProps) {
  return (
    <section className="panel note-panel" aria-labelledby="note-title">
      <div className="section-heading note-heading">
        <div>
          <span className="eyebrow">02 / NOTE STUDIO</span>
          <h2 id="note-title">小红书笔记</h2>
        </div>
        <span className="platform-mark"><span className="platform-dot" />RED NOTE</span>
      </div>

      <div className="note-editor">
        <label className="input-label" htmlFor="note-headline">笔记标题 <span>{title.length} / 30</span></label>
        <input id="note-headline" className="title-input" value={title} onChange={(event) => onTitleChange(event.target.value)} maxLength={30} />

        <label className="input-label content-label" htmlFor="note-content">正文内容 <span>可直接编辑</span></label>
        <textarea id="note-content" className="content-input" value={content} onChange={(event) => onContentChange(event.target.value)} rows={11} />

        <div className="tags-heading"><span className="input-label">话题标签</span><span>点击标签即可复制</span></div>
        <TagList tags={tags} onCopy={onTagsCopy} />
      </div>

      <div className="note-footer">
        <button className="button button-primary copy-note" onClick={onCopyAll}><IconCopy />复制全文</button>
        <button className="button button-quiet" onClick={onRegenerate} disabled={isGenerating}><IconRefresh />{isGenerating ? "正在分析画面…" : "重新生成"}</button>
        <span className="variant-label">{result.imageName}</span>
      </div>
    </section>
  );
}
