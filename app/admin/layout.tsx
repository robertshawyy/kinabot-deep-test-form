import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "反馈雷达 · KinaBot",
  description: "KinaBot 深度用户反馈的自动提炼与累计洞察。",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
