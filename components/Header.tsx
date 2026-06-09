"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/seasonal",   label: "探す" },
  { href: "/watchlist",  label: "視聴リスト" },
  { href: "/dashboard",  label: "年間" },
  { href: "/ranking",    label: "ランキング" },
  { href: "/settings",   label: "設定" },
];

function CureelIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="13" r="12" stroke="#8B5CF6" strokeWidth="1" opacity="0.3"/>
      <circle cx="13" cy="13" r="8" stroke="#8B5CF6" strokeWidth="1.2" opacity="0.6"/>
      <circle cx="13" cy="13" r="4.5" stroke="#8B5CF6" strokeWidth="1.8"/>
      <circle cx="13" cy="13" r="1.8" fill="#A78BFA"/>
      <line x1="13" y1="1" x2="13" y2="4" stroke="#8B5CF6" strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
      <line x1="13" y1="22" x2="13" y2="25" stroke="#8B5CF6" strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
      <line x1="1" y1="13" x2="4" y2="13" stroke="#8B5CF6" strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
      <line x1="22" y1="13" x2="25" y2="13" stroke="#8B5CF6" strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
      <line x1="3.2" y1="3.2" x2="5.5" y2="5.5" stroke="#8B5CF6" strokeWidth="1" opacity="0.35" strokeLinecap="round"/>
      <line x1="20.5" y1="20.5" x2="22.8" y2="22.8" stroke="#8B5CF6" strokeWidth="1" opacity="0.35" strokeLinecap="round"/>
      <line x1="22.8" y1="3.2" x2="20.5" y2="5.5" stroke="#8B5CF6" strokeWidth="1" opacity="0.35" strokeLinecap="round"/>
      <line x1="5.5" y1="20.5" x2="3.2" y2="22.8" stroke="#8B5CF6" strokeWidth="1" opacity="0.35" strokeLinecap="round"/>
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/seasonal" className="shrink-0 flex items-center gap-2">
          <CureelIcon />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
            Cureel
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                pathname.startsWith(href)
                  ? "bg-violet-700 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
