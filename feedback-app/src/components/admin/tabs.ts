export type AdminTab = "overview" | "posts" | "comments" | "moderation" | "rewards" | "logs";

export const TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: "overview", label: "개요", icon: "LayoutDashboard" },
  { key: "posts", label: "글 관리", icon: "FileText" },
  { key: "comments", label: "댓글", icon: "MessageSquare" },
  { key: "moderation", label: "신고함", icon: "Siren" },
  { key: "rewards", label: "보상", icon: "Gift" },
  { key: "logs", label: "로그", icon: "ScrollText" },
];
