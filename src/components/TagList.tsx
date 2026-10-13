"use client";

import { IconCopy } from "@/components/Icons";

interface TagListProps {
  tags: string[];
  onCopy: (tag: string) => void;
}

export function TagList({ tags, onCopy }: TagListProps) {
  return (
    <div className="tag-list" aria-label="笔记话题标签">
      {tags.map((tag) => (
        <button className="tag-chip" key={tag} onClick={() => onCopy(tag)} title={`复制 ${tag}`}>
          {tag}<IconCopy />
        </button>
      ))}
    </div>
  );
}
