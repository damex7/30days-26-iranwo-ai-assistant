"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/dashboard", "Home"], ["/chat", "Chat"], ["/invoices", "Invoices"],
  ["/replies", "Replies"], ["/posts", "Posts"], ["/settings", "Shop"],
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="-mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} className="navlink" aria-current={path === href || path.startsWith(href + "/") ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
