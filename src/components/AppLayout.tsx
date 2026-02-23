import { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Page = "dashboard" | "documents" | "upload" | "versions" | "approvals" | "comments" | "audit" | "reports";

interface AppLayoutProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  children: ReactNode;
  userName: string;
  userRole: string;
  userEmail: string;
}

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  documents: "Documents",
  upload: "Upload Document",
  versions: "Version History",
  approvals: "Approvals",
  comments: "Comments",
  audit: "Audit Trail",
  reports: "Reports",
};

const navSections = [
  {
    title: "Overview",
    items: [{ id: "dashboard" as Page, label: "Dashboard" }],
  },
  {
    title: "Documents",
    items: [
      { id: "documents" as Page, label: "All Documents" },
      { id: "upload" as Page, label: "Upload" },
      { id: "versions" as Page, label: "Version History" },
    ],
  },
  {
    title: "Workflow",
    items: [
      { id: "approvals" as Page, label: "Approvals", badge: true },
      { id: "comments" as Page, label: "Comments" },
    ],
  },
  {
    title: "Admin",
    items: [
      { id: "audit" as Page, label: "Audit Trail" },
      { id: "reports" as Page, label: "Reports" },
    ],
  },
];

const AppLayout = ({ currentPage, onPageChange, children, userName, userRole, userEmail }: AppLayoutProps) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  const initials = userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen">
      <div className="fixed inset-0 grid-bg pointer-events-none z-0" />

      {/* Sidebar */}
      <aside className="w-56 bg-surface border-r border-border fixed top-0 left-0 h-screen z-50 flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="font-display font-semibold text-base">Secure<span className="text-primary">Vault</span></div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              <div className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase px-2 mb-2">{section.title}</div>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-all mb-0.5 ${
                    currentPage === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-surface2 hover:text-foreground"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-[13px] font-semibold text-primary">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{userName || userEmail}</div>
            <div className="text-[11px] text-muted-foreground capitalize">{userRole}</div>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground/60 hover:text-destructive transition-colors text-sm" title="Logout">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 relative z-10">
        <div className="bg-surface border-b border-border px-6 h-14 flex items-center justify-between sticky top-0 z-40">
          <div className="font-display text-lg font-semibold">{pageTitles[currentPage]}</div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
              Secure
            </div>
            <button onClick={() => onPageChange("upload")} className="px-3 py-1.5 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all">Upload</button>
          </div>
        </div>
        <div className="p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
export type { Page };
