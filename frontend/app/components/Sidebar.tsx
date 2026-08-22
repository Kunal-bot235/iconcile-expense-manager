"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/expenses/new", label: "Add Expense", icon: "➕" },
  { href: "/expenses", label: "Expenses", icon: "📋" },
  { href: "/upload", label: "CSV Upload", icon: "📤" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">💰</span>
        <h1 className="brand-title">Expense Manager</h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href ? "nav-link-active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>iConCile Technologies</p>
      </div>
    </aside>
  );
}
