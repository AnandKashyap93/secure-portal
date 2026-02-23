import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ReportsPage = () => {
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0, draft: 0 });
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: total } = await supabase.from("documents").select("*", { count: "exact", head: true });
      const { count: approved } = await supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "approved");
      const { count: rejected } = await supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "rejected");
      const { count: pending } = await supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "pending");
      const { count: draft } = await supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "draft");
      setStats({ total: total || 0, approved: approved || 0, rejected: rejected || 0, pending: pending || 0, draft: draft || 0 });
    };

    const fetchProfiles = async () => {
      const { data } = await supabase.from("profiles").select("*");
      if (data) setProfiles(data);
    };

    fetchStats();
    fetchProfiles();
  }, []);

  const breakdown = [
    { label: "Approved", value: stats.approved, pct: stats.total ? Math.round((stats.approved / stats.total) * 100) : 0, color: "bg-success" },
    { label: "Rejected", value: stats.rejected, pct: stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0, color: "bg-destructive" },
    { label: "Pending", value: stats.pending, pct: stats.total ? Math.round((stats.pending / stats.total) * 100) : 0, color: "bg-warning" },
    { label: "Draft", value: stats.draft, pct: stats.total ? Math.round((stats.draft / stats.total) * 100) : 0, color: "bg-muted-foreground" },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 mb-5">
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">Document Statistics</div>
          <div className="p-5">
            <div className="font-display text-[32px] font-extrabold mb-1">{stats.total}</div>
            <div className="text-sm text-muted-foreground mb-4">Total documents</div>
            <div className="h-3 bg-border rounded-full overflow-hidden flex">
              {breakdown.map((b) => b.pct > 0 && (
                <div key={b.label} className={`h-full ${b.color}`} style={{ width: `${b.pct}%` }} title={`${b.label}: ${b.pct}%`} />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">Approval Breakdown</div>
          <div className="p-5">
            <div className="font-display text-[32px] font-extrabold mb-4">{stats.total} <span className="text-sm text-muted-foreground font-normal">total</span></div>
            {breakdown.map((b) => (
              <div key={b.label} className="flex items-center gap-3 mb-2.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${b.color}`} />
                <div className="text-xs flex-1">{b.label}</div>
                <div className="text-xs font-mono text-muted-foreground">{b.pct}% · {b.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">Registered Users</div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase px-4 py-2.5 border-b border-border bg-surface">Name</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase px-4 py-2.5 border-b border-border bg-surface">Role</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase px-4 py-2.5 border-b border-border bg-surface">Joined</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-surface2 transition-colors">
                <td className="px-4 py-3 text-[13px] border-b border-border text-primary">{p.first_name} {p.last_name}</td>
                <td className="px-4 py-3 text-[13px] border-b border-border">
                  <span className="font-mono text-[11px] bg-surface2 border border-border2 rounded px-1.5 py-0.5 text-muted-foreground capitalize">{p.role}</span>
                </td>
                <td className="px-4 py-3 text-[11px] border-b border-border font-mono text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsPage;
