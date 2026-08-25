"use client";

import Link from "next/link";
import { AiFillProduct } from "react-icons/ai";
import { AuthAnimatedBlock } from "@/components/auth/AuthAnimatedBlock";

/**
 * REQ-0031 — Navbar-matched brand for auth left column.
 * Keep icon box + title classes in sync with components/layouts/Navbar.tsx.
 */
export function AuthBrandHeader() {
  return (
    <AuthAnimatedBlock delayMs={0}>
      <Link
        href="/"
        className="group flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
        aria-label="Stockly — Stock Inventory Management"
      >
        <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-100 dark:bg-rose-950/45 shadow-sm transition-all duration-200 group-hover:border-rose-300 dark:group-hover:border-rose-700 group-hover:bg-rose-200 dark:group-hover:bg-rose-900/50">
          <AiFillProduct className="text-sm sm:text-lg text-rose-600 dark:text-rose-400 transition-transform group-hover:scale-110 drop-shadow-[0_2px_8px_rgba(225,29,72,0.4)]" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-sm sm:text-lg font-medium tracking-tight text-rose-700 dark:text-rose-300 transition-colors duration-300 group-hover:text-rose-800 dark:group-hover:text-rose-200">
            Stockly
          </p>
          <p className="text-sm text-gray-600 dark:text-white/80 leading-snug">
            Stock Inventory Management
          </p>
        </div>
      </Link>
    </AuthAnimatedBlock>
  );
}
