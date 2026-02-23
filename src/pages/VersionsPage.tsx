import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const statusClass: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  draft: "bg-muted-foreground/15 text-muted-foreground",
};

const VersionsPage = () => {
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (data) setDocuments(data);
    };
    fetch();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">Version History</div>
        <div className="p-5">
          {documents.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No documents yet.</div>
          ) : (
            <div className="relative pl-5">
              <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-border" />
              {documents.map((doc, i) => (
                <div key={doc.id} className="relative mb-5 last:mb-0">
                  <div className={`absolute -left-[14px] top-1 w-3 h-3 rounded-full border-2 border-background ${i === 0 ? "bg-primary" : "bg-border2"}`} />
                  <div className="text-[13px] font-semibold">
                    {doc.title} — {doc.version}
                    <span className={`ml-2 text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${statusClass[doc.status]}`}>{doc.status}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{format(new Date(doc.created_at), "MMM d, yyyy · HH:mm 'UTC'")}</div>
                  {doc.version_notes && <div className="text-xs text-muted-foreground mt-1">{doc.version_notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">All Versioned Documents</div>
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-surface2 transition-colors">
            <div className="w-[38px] h-[38px] bg-surface2 border border-border2 rounded-lg flex items-center justify-center text-lg">📄</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">{doc.title}</div>
              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{doc.version} · {format(new Date(doc.updated_at), "MMM d")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionsPage;
