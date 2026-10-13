"use client";

import { IconArrowUpRight, IconCopy } from "@/components/Icons";

interface HookBannerProps {
  hook: string;
  onCopy: () => void;
}

export function HookBanner({ hook, onCopy }: HookBannerProps) {
  return (
    <>
      <section className="hook-banner" aria-labelledby="hook-title">
        <div className="hook-art" aria-hidden="true"><span className="hook-orbit orbit-one" /><span className="hook-orbit orbit-two" /><span className="hook-spark">✳</span></div>
        <div className="hook-copy">
          <span className="eyebrow">A LITTLE MORE TO DISCOVER</span>
          <h2 id="hook-title">想要完整版范画和高清步骤图？</h2>
          <p>私信我，24 小时内发你。</p>
        </div>
        <button className="button hook-button" onClick={onCopy}><IconCopy />复制私信话术<IconArrowUpRight className="hook-arrow" /></button>
      </section>
      <p className="disclaimer">本工具生成内容仅供参考，发布前请人工审核 <span>·</span> 话术示例：{hook}</p>
    </>
  );
}
