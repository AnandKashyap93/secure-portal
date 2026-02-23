import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const CommentsPage = ({ userId, userEmail }: { userId: string; userEmail: string }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchDocs = async () => {
      const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (data) {
        setDocuments(data);
        if (data.length > 0) setSelectedDoc(data[0].id);
      }
    };
    const fetchProfiles = async () => {
      const { data } = await supabase.from("profiles").select("*");
      if (data) {
        const map: Record<string, any> = {};
        data.forEach((p) => (map[p.user_id] = p));
        setProfiles(map);
      }
    };
    fetchDocs();
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (!selectedDoc) return;
    const fetchComments = async () => {
      const { data } = await supabase.from("comments").select("*").eq("document_id", selectedDoc).order("created_at", { ascending: true });
      if (data) setComments(data);
    };
    fetchComments();
  }, [selectedDoc]);

  const addComment = async () => {
    if (!newComment.trim() || !selectedDoc) return;
    const { error } = await supabase.from("comments").insert({ document_id: selectedDoc, user_id: userId, content: newComment.trim() });
    if (error) {
      toast.error("Failed to post comment");
    } else {
      toast.success("Comment posted 💬");
      setNewComment("");
      const { data } = await supabase.from("comments").select("*").eq("document_id", selectedDoc).order("created_at", { ascending: true });
      if (data) setComments(data);
    }
  };

  const selectedDocTitle = documents.find((d) => d.id === selectedDoc)?.title || "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">Comments — {selectedDocTitle}</div>
        <div className="p-5">
          {comments.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first to comment!</div>
          ) : (
            comments.map((c) => {
              const profile = profiles[c.user_id];
              const name = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "User";
              const initial = name.charAt(0).toUpperCase();
              return (
                <div key={c.id} className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground flex-shrink-0">{initial}</div>
                  <div className="bg-surface2 border border-border rounded-xl px-3.5 py-3 flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[13px] font-semibold">{name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{format(new Date(c.created_at), "MMM d · HH:mm")}</span>
                    </div>
                    <div className="text-[13px] text-muted-foreground leading-relaxed">{c.content}</div>
                  </div>
                </div>
              );
            })
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 tracking-wider uppercase">Add Comment</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your feedback..."
              className="w-full px-3.5 py-2.5 bg-background border border-border2 rounded-lg text-foreground text-sm outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)] resize-y min-h-[80px]"
            />
            <button onClick={addComment} className="mt-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all">💬 Post Comment</button>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">Documents</div>
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedDoc(doc.id)}
            className={`w-full flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 transition-colors text-left ${selectedDoc === doc.id ? "bg-primary/5" : "hover:bg-surface2"}`}
          >
            <div className="w-[38px] h-[38px] bg-surface2 border border-border2 rounded-lg flex items-center justify-center text-lg">📄</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">{doc.title}</div>
              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{doc.filename}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommentsPage;
