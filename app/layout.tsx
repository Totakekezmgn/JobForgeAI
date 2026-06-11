import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "JobForge AI",
  description: "IT就活を一元管理するAI就活OS"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <nav className="nav">
          <Link href="/"><strong>JobForge AI</strong></Link>
          <div className="nav-links">
            <Link href="/">ダッシュボード</Link>
            <Link href="/companies">企業管理</Link>
            <Link href="/import-company">企業追加AI</Link>
            <Link href="/calendar">締切・予定</Link>
            <Link href="/tasks">タスク</Link>
            <Link href="/calendar-export">カレンダー出力</Link>
            <Link href="/es">ES管理</Link>
            <Link href="/interview">面接対策</Link>
            <Link href="/voice-interview">音声面接</Link>
            <Link href="/interview-logs">面接ログ</Link>
            <Link href="/research">企業研究</Link>
            <Link href="/live-research">自動リサーチ</Link>
            <Link href="/company">企業別Code対策</Link>
            <Link href="/roadmap">Codeロードマップ</Link>
            <Link href="/data">データ管理</Link>
            <Link href="/cloud">クラウド同期</Link>
            <Link href="/pricing">料金</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
