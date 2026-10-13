"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import type { ArtworkSample, LocalImage } from "@/lib/types";
import { IconClose, IconImage, IconUpload } from "@/components/Icons";

interface UploadZoneProps {
  image: LocalImage | null;
  examples: ArtworkSample[];
  onFileSelect: (file: File) => void;
  onSampleSelect: (sample: ArtworkSample) => void;
  onClear: () => void;
}

function formatSize(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadZone({ image, examples, onFileSelect, onSampleSelect, onClear }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const acceptFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || !["image/jpeg", "image/png"].includes(file.type)) {
      setError("请选择 JPG 或 PNG 格式的图片。");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("图片大小请控制在 15 MB 以内。");
      return;
    }
    setError("");
    onFileSelect(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const useExample = () => {
    const currentIndex = examples.findIndex((example) => example.src === image?.src);
    onSampleSelect(examples[(currentIndex + 1) % examples.length]);
    setError("");
  };

  return (
    <section className="panel upload-panel" aria-labelledby="upload-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">01 / ADD YOUR ARTWORK</span>
          <h2 id="upload-title">放一张范画进来</h2>
        </div>
        <span className="step-pill">本地预览</span>
      </div>

      <div
        className={`dropzone ${dragging ? "dropzone-active" : ""} ${image ? "has-image" : ""}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={handleDrop}
      >
        {image ? (
          <>
            <div className="preview-frame">
              <img src={image.src} alt={`范画预览：${image.name}`} className="art-preview" />
              <button className="remove-image" onClick={onClear} aria-label="移除图片" title="移除图片"><IconClose /></button>
              {image.kind === "sample" && <span className="preview-badge">示例图</span>}
            </div>
            <div className="file-meta">
              <div className="file-icon"><IconImage /></div>
              <div className="file-copy"><strong title={image.name}>{image.name}</strong><span>{image.sizeLabel}</span></div>
              <button className="text-button change-image" onClick={() => inputRef.current?.click()}>更换图片</button>
            </div>
          </>
        ) : (
          <button className="empty-dropzone" onClick={() => inputRef.current?.click()} type="button">
            <span className="upload-icon-wrap"><IconUpload /></span>
            <strong>点击或拖拽上传范画照片</strong>
            <span>支持 JPG / PNG，单张不超过 15 MB</span>
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png" onChange={handleChange} hidden />
      <div className="upload-actions">
        <button className="button button-secondary" onClick={useExample} type="button">
          <IconImage />{image?.kind === "sample" ? "换一张示例图" : "使用示例图片"}
        </button>
        <span className="upload-hint">{image ? "图片只在当前浏览器预览" : "试试内置案例，快速体验完整流程"}</span>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </section>
  );
}
