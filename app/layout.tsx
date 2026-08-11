import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? forwardedProtocol
    : host.startsWith("localhost")
      ? "http"
      : "https";
  const imageUrl = new URL("/og-feedback.png", `${protocol}://${host}`).toString();

  return {
    title: "KinaBot 深度用户反馈表单",
    description: "面向 KinaBot 深度测试用户的匿名、隐私友好型产品反馈表单。",
    icons: {
      icon: "/og-feedback.png",
      shortcut: "/og-feedback.png",
    },
    openGraph: {
      title: "KinaBot 深度用户反馈表单",
      description: "把真实问题，说清楚就好。",
      type: "website",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "KinaBot 深度用户反馈表单" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "KinaBot 深度用户反馈表单",
      description: "把真实问题，说清楚就好。",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
