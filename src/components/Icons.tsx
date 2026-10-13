import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function IconSparkles(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="m12 3 1.3 5.7L19 10l-5.7 1.3L12 17l-1.3-5.7L5 10l5.7-1.3L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" fill="currentColor"/></svg>;
}

export function IconUpload(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M12 15V4m0 0L8 8m4-4 4 4M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function IconCopy(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.5"/></svg>;
}

export function IconArrowUpRight(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function IconRefresh(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M20 7v5h-5M4.7 9A7.5 7.5 0 0 1 18 6l2 6M4 17v-5h5m10.3 3A7.5 7.5 0 0 1 6 18l-2-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function IconClose(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}

export function IconImage(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="m4 17 5-4 3 2 3-3 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
