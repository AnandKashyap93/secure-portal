import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusClass: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  draft: "bg-muted-foreground/15 text-muted-foreground",
};

const ApprovalsPage = ({ userId }: { userId: string }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  const fetchDocs = async () => {
    let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    if (data) setDocuments(data);
  };

  useEffect(() => { fetchDocs(); }, [filter]);

  const updateStatus = async (docId: string, status: string) => {
    const { error } = await supabase.from("documents").update({ status }).eq("id", docId);
    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success(status === "approved" ? "Document approved! ✅" : "Document rejected ❌");
      fetchDocs();
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border transition-all capitalize ${filter === f ? "bg-primary/10 text-primary border-primary/30" : "border-border2 text-muted-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No documents to review.</div>
      ) : (
        documents.map((doc) => (
          <div key={doc.id} className="bg-surface border border-border rounded-xl p-5 mb-3.5 hover:border-border2 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-display text-[15px] font-bold">{doc.title}</div>
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{doc.filename} · {doc.version} · {new Date(doc.created_at).toLocaleDateString()}</div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${statusClass[doc.status]}`}>{doc.status}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap mb-3">
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface2 text-muted-foreground font-mono">{doc.category}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface2 text-muted-foreground font-mono">{doc.priority}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface2 text-muted-foreground font-mono">{(doc.file_size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            {doc.version_notes && <p className="text-[13px] text-muted-foreground mb-3.5 leading-relaxed">{doc.version_notes}</p>}
            <div className="flex gap-2">
              {doc.status === "pending" && (
                <>
                  <button onClick={() => updateStatus(doc.id, "approved")} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-all">✅ Approve</button>
                  <button onClick={() => updateStatus(doc.id, "rejected")} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-all">✗ Reject</button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ApprovalsPage;
