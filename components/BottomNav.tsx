import Link from "next/link";

const ITEMS = [
  { href: "/dashboard", label: "Home" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/study", label: "Study" },
  { href: "/courses", label: "Courses" },
] as const;

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-md justify-around py-2">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-1 text-center text-xs text-ink-muted hover:text-forest"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
