"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation";

// Highlights the current section. The home link only matches exactly.
export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const home = items[0]?.href;

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => {
        const active =
          item.href === home ? pathname === home : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
              active ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
