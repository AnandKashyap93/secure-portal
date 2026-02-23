import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const AuditPage = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50);
      if (data) setLogs(data);
    };
    fetchLogs();
  }, []);

  const actionColors: Record<string, string> = {
    UPLOAD: "text-primary",
    APPROVE: "text-success",
    REJECT: "text-destructive",
    COMMENT: "text-secondary",
    UPDATE: "text-muted-foreground",
    LOGIN: "text-warning",
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="font-display text-sm font-bold">Audit Log</div>
      </div>
      <div className="p-5">
        {logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No audit logs yet.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 py-2.5 border-b border-border last:border-b-0 text-xs">
              <div className="font-mono text-muted-foreground min-w-[100px]">{format(new Date(log.created_at), "HH:mm · MMM d")}</div>
              <div className={`font-semibold min-w-[80px] ${actionColors[log.action] || "text-foreground"}`}>{log.action}</div>
              <div className="text-primary font-medium min-w-[140px]">{log.user_email || "—"}</div>
              <div className="text-muted-foreground flex-1">{log.detail}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditPage;
