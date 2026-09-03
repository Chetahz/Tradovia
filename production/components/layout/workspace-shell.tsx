"use client";

import Link from "next/link";
import { TradoviaLogo } from "@/components/brand/tradovia-logo";
import { PreferencesProvider, usePreferences } from "@/components/providers/preferences-provider";
import { Button } from "@/components/ui/button";
import { workspaceNavigation } from "@/lib/navigation";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return <PreferencesProvider><Shell>{children}</Shell></PreferencesProvider>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const { theme, language, toggleTheme, toggleLanguage } = usePreferences();
  return <div className="workspace-shell">
    <aside className="workspace-sidebar" aria-label="Workspace navigation">
      <TradoviaLogo />
      <div className="sidebar-copy">Trading Intelligence Platform</div>
      <nav className="workspace-nav">{workspaceNavigation.map(group => <section key={group.label} className="nav-group"><p>{group.label}</p>{group.items.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</section>)}</nav>
    </aside>
    <div className="workspace-main">
      <header className="workspace-header"><div className="workspace-header-brand"><TradoviaLogo compact/><span className="environment-badge">Prototype data</span></div><div className="header-actions"><Button variant="ghost" onClick={toggleTheme} aria-label="Switch color theme">{theme === "dark" ? "☀ Light" : "☾ Dark"}</Button><Button variant="ghost" onClick={toggleLanguage} aria-label="Switch language">{language} / {language === "EN" ? "TH" : "EN"}</Button><Link className="tv-button tv-button--primary" href="/workspace/journal">+ Add Trade</Link></div></header>
      <main className="workspace-content">{children}</main>
      <nav className="mobile-tabs" aria-label="Mobile navigation"><Link href="/workspace">Today</Link><Link href="/workspace/journal">Journal</Link><Link className="mobile-add" aria-label="Add trade" href="/workspace/journal">+</Link><Link href="/workspace/calendar">Calendar</Link><Link href="/workspace/analytics">Insights</Link></nav>
    </div>
  </div>;
}
