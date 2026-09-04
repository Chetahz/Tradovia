export type WorkspaceNavItem = { label: string; href: string; };
export type WorkspaceNavGroup = { label: string; items: WorkspaceNavItem[]; };
export const workspaceNavigation: WorkspaceNavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/workspace" }] },
  { label: "Trading", items: [
    { label: "Journal", href: "/workspace/journal" },
    { label: "Calendar", href: "/workspace/calendar" },
    { label: "Playbook", href: "/workspace/playbook" },
    { label: "Goals & Rules", href: "/workspace/goals" },
  ]},
  { label: "Intelligence", items: [{ label: "Analytics", href: "/workspace/analytics" }] },
  { label: "Tools", items: [
    { label: "TradingView", href: "/workspace/tradingview" },
    { label: "Economic Calendar", href: "/workspace/economic-calendar" },
    { label: "Market News", href: "/workspace/news" },
    { label: "Risk Calculator", href: "/workspace/risk" },
  ]},
];
