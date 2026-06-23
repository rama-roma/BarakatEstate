"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Главная", match: "home" },
  { href: "/listings", label: "Объявления", match: "listings" },
  { href: "/map", label: "Карта", match: "map" },
  { href: "/services", label: "Услуги", match: "services" },
  { href: "/about", label: "О нас", match: "about" },
];

function activePage(pathname: string) {
  return pathname.split("/").filter(Boolean)[0] || "home";
}

export default function Navigation() {
  const pathname = usePathname();
  const current = activePage(pathname);
  const [open, setOpen] = useState(false);

  return (
    <nav id="nav">
      <Link className="nav-logo" href="/" onClick={() => setOpen(false)}>
        <Image src="/barakat.PNG" alt="Barakat Estate" width={100} height={78} priority />
      </Link>

      <div className={`nav-links${open ? " mobile-open" : ""}`}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={current === link.match ? "active" : undefined}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="nav-actions">
        <span className="nav-city">Душанбе</span>
        <Link href="/favorites" className="nav-favorites-btn" aria-label="Избранное">
          <Heart size={18} strokeWidth={2} />
        </Link>
        <button
          className="mobile-menu-btn"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Меню"
          aria-expanded={open}
        >
          <Menu size={22} strokeWidth={2} />
        </button>
      </div>
    </nav>
  );
}
