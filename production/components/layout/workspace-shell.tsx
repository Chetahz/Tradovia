import Link from "next/link";
import { workspaceNavigation } from "@/lib/navigation";
import { Button } from "@/components/ui/button";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar" aria-label="Workspace navigation">
        <Link href="/" className="brand">TRADOVIA</Link>
        <div className="sidebar-copy">Trading Intelligence Platform</div>
        <nav className="workspace-nav">
          {workspaceNavigation.map((group) => (
            <section key={group.label} className="nav-group">
              <p>{group.label}</p>
              {group.items.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            </section>
          ))}
        </nav>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <div>
            <span className="mobile-brand">TRADOVIA</span>
            <span className="environment-badge">Prototype data</span>
          </div>
          <div className="header-actions">
            <Button variant="ghost" aria-label="Switch language">EN / TH</Button>
            <Button variant="primary">+ Add Trade</Button>
          </div>
        </header>
        <main className="workspace-content">{children}</main>
        <nav className="mobile-tabs" aria-label="Mobile navigation">
          <Link href="/workspace">Today</Link>
          <Link href="/workspace/journal">Journal</Link>
          <button aria-label="Add trade">+</button>
          <Link href="/workspace/calendar">Calendar</Link>
          <Link href="/workspace/analytics">Insights</Link>
        </nav>
      </div>
    </div>
  );
}
