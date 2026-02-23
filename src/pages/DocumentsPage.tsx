import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

const statusClass: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  draft: "bg-muted-foreground/15 text-muted-foreground",
};

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  const fetchDocs = async () => {
    let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    if (data) setDocuments(data);
  };

  useEffect(() => { fetchDocs(); }, [filter]);

  const filters = ["all", "pending", "approved", "rejected", "draft"];

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border transition-all capitalize ${
              filter === f ? "bg-primary/10 text-primary border-primary/30" : "border-border2 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? `All (${documents.length})` : f}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase px-4 py-2.5 border-b border-border bg-surface">Name</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase px-4 py-2.5 border-b border-border bg-surface">Type</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase px-4 py-2.5 border-b border-border bg-surface">Version</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase px-4 py-2.5 border-b border-border bg-surface">Size</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase px-4 py-2.5 border-b border-border bg-surface">Date</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground/60 tracking-wider uppercase px-4 py-2.5 border-b border-border bg-surface">Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No documents found.</td></tr>
            ) : (
              documents.map((doc) => {
                const ext = doc.filename.split(".").pop()?.toUpperCase() || "";
                return (
                  <tr key={doc.id} className="hover:bg-surface2 transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-[13px] border-b border-border">
                      <span className="mr-1.5">📄</span>{doc.title}
                    </td>
                    <td className="px-4 py-3 text-[13px] border-b border-border">
                      <span className="font-mono text-[11px] bg-surface2 border border-border2 rounded px-1.5 py-0.5 text-muted-foreground">{ext}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] border-b border-border">
                      <span className="font-mono text-[11px] bg-surface2 border border-border2 rounded px-1.5 py-0.5 text-muted-foreground">{doc.version}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] border-b border-border text-muted-foreground">{(doc.file_size / 1024 / 1024).toFixed(1)} MB</td>
                    <td className="px-4 py-3 text-[11px] border-b border-border font-mono text-muted-foreground">{format(new Date(doc.created_at), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 border-b border-border">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${statusClass[doc.status] || statusClass.draft}`}>{doc.status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentsPage;
