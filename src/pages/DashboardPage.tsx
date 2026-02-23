import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Document {
  id: string;
  title: string;
  filename: string;
  file_size: number;
  file_type: string;
  status: string;
  version: string;
  category: string;
  created_at: string;
  uploaded_by: string;
}

interface AuditLog {
  action: string;
  detail: string;
  user_email: string;
  created_at: string;
}

const statusClass: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  draft: "bg-muted-foreground/15 text-muted-foreground",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  draft: "Draft",
};

const fileIcon: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  xlsx: "📊",
  png: "🖼️",
  jpg: "🖼️",
};

const DashboardPage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, users: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const { data: docs } = await supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(4);
      if (docs) {
        setDocuments(docs);
        const total = docs.length;
        const pending = docs.filter((d) => d.status === "pending").length;
        const approved = docs.filter((d) => d.status === "approved").length;
        setStats({ total, pending, approved, users: 1 });
      }

      // Get full count
      const { count: totalCount } = await supabase.from("documents").select("*", { count: "exact", head: true });
      const { count: pendingCount } = await supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "pending");
      const { count: approvedCount } = await supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "approved");
      const { count: profileCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      setStats({ total: totalCount || 0, pending: pendingCount || 0, approved: approvedCount || 0, users: profileCount || 0 });

      const { data: logs } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(5);
      if (logs) setAuditLogs(logs);
    };
    fetchData();
  }, []);

  const statCards = [
    { icon: "📁", value: stats.total, label: "Total Documents", delta: "All time", color: "from-primary to-[#0099cc]" },
    { icon: "⏳", value: stats.pending, label: "Pending Approvals", delta: "Requires action", color: "from-warning to-[#fbbf24]" },
    { icon: "✅", value: stats.approved, label: "Approved", delta: "Completed", color: "from-success to-[#34d399]" },
    { icon: "👥", value: stats.users, label: "Active Users", delta: "Registered", color: "from-secondary to-[#a855f7]" },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {statCards.map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.color}`} />
            <div className="text-[22px] mb-3">{s.icon}</div>
            <div className="font-display text-[32px] font-extrabold leading-none">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            <div className="text-[11px] text-success mt-2">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="font-display text-sm font-bold">Recent Documents</div>
            <button onClick={() => onNavigate("documents")} className="text-xs px-2.5 py-1 rounded-lg border border-border2 text-muted-foreground hover:text-foreground hover:bg-surface2 transition-all">View All</button>
          </div>
          {documents.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">No documents yet. Upload your first document!</div>
          ) : (
            documents.map((doc) => {
              const ext = doc.filename.split(".").pop()?.toLowerCase() || "";
              return (
                <div key={doc.id} className="flex items-center gap-3.5 px-5 py-3 border-b border-border last:border-b-0 hover:bg-surface2 transition-colors cursor-pointer">
                  <div className="w-[38px] h-[38px] bg-surface2 border border-border2 rounded-lg flex items-center justify-center text-lg flex-shrink-0">{fileIcon[ext] || "📎"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{doc.title}</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{doc.filename} · {doc.version} · {(doc.file_size / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${statusClass[doc.status] || statusClass.draft}`}>{statusLabel[doc.status] || doc.status}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <div className="font-display text-sm font-bold">Recent Activity</div>
            </div>
            <div className="p-5">
              {auditLogs.length === 0 ? (
                <div className="text-sm text-muted-foreground">No activity yet.</div>
              ) : (
                auditLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 mb-4 last:mb-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${log.action === "APPROVE" ? "bg-success" : log.action === "REJECT" ? "bg-destructive" : log.action === "UPLOAD" ? "bg-primary" : "bg-secondary"}`} />
                    <div>
                      <div className="text-xs leading-relaxed"><strong>{log.user_email || "System"}</strong> {log.detail}</div>
                      <div className="text-[11px] text-muted-foreground/60 font-mono">{format(new Date(log.created_at), "MMM d, HH:mm")}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
