"use client";

import Link from "next/link";
import { TradoviaLogo } from "@/components/brand/tradovia-logo";
import { PreferencesProvider, usePreferences } from "@/components/providers/preferences-provider";
import { Button } from "@/components/ui/button";
import { workspaceNavigation } from "@/lib/navigation";

const th:Record<string,string>={Overview:"ภาพรวม",Dashboard:"แดชบอร์ด",Trading:"การเทรด",Journal:"บันทึกการเทรด",Calendar:"ปฏิทิน",Playbook:"เพลย์บุ๊ก","Goals & Rules":"เป้าหมายและกฎ",Intelligence:"อินเทลลิเจนซ์",Analytics:"วิเคราะห์",Tools:"เครื่องมือ",TradingView:"TradingView","Economic Calendar":"ปฏิทินเศรษฐกิจ","Market News":"ข่าวตลาด","Risk Calculator":"คำนวณความเสี่ยง",Today:"วันนี้",Insights:"อินไซต์"};

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return <PreferencesProvider><Shell>{children}</Shell></PreferencesProvider>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const { theme, language, toggleTheme, toggleLanguage } = usePreferences();
  const label=(value:string)=>language==="TH"?(th[value]??value):value;
  return <div className="workspace-shell">
    <aside className="workspace-sidebar" aria-label="Workspace navigation">
      <TradoviaLogo />
      <div className="sidebar-copy">Trading Intelligence Platform</div>
      <nav className="workspace-nav">{workspaceNavigation.map(group => <section key={group.label} className="nav-group"><p>{label(group.label)}</p>{group.items.map(item => <Link key={item.href} href={item.href}>{label(item.label)}</Link>)}</section>)}</nav>
    </aside>
    <div className="workspace-main">
      <header className="workspace-header"><div className="workspace-header-brand"><TradoviaLogo compact/><span className="environment-badge">{language==="TH"?"ข้อมูลต้นแบบ":"Prototype data"}</span></div><div className="header-actions"><Button variant="ghost" onClick={toggleTheme} aria-label="Switch color theme">{theme === "dark" ? (language==="TH"?"☀ สว่าง":"☀ Light") : (language==="TH"?"☾ มืด":"☾ Dark")}</Button><Button variant="ghost" onClick={toggleLanguage} aria-label={`Switch language. Current language ${language}`}>EN / TH</Button><Link className="tv-button tv-button--primary" href="/workspace/journal?action=add">{language==="TH"?"+ เพิ่ม Trade":"+ Add Trade"}</Link></div></header>
      <main className="workspace-content">{children}</main>
      <nav className="mobile-tabs" aria-label="Mobile navigation"><Link href="/workspace">{label("Today")}</Link><Link href="/workspace/journal">{label("Journal")}</Link><Link className="mobile-add" aria-label="Add trade" href="/workspace/journal?action=add">+</Link><Link href="/workspace/calendar">{label("Calendar")}</Link><Link href="/workspace/analytics">{label("Insights")}</Link></nav>
    </div>
  </div>;
}
