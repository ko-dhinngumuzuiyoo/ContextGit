"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ContextGit
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/"
            className={`hover:text-black ${pathname === "/" ? "text-black font-medium" : "text-gray-500"}`}
          >
            Repos
          </Link>
        </nav>
      </div>
    </header>
  );
}
