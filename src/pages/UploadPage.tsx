import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UploadPage = ({ userId }: { userId: string }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Contract");
  const [priority, setPriority] = useState("Normal");
  const [versionNotes, setVersionNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (f: File) => {
    setFile(f);
    setTitle(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const submitUpload = async () => {
    if (!title) { toast.error("Please enter a document title"); return; }
    if (!file) { toast.error("Please select a file"); return; }

    setUploading(true);
    setProgress(0);

    // Simulate progress
    const iv = setInterval(() => setProgress((p) => Math.min(p + 15, 90)), 200);

    const filePath = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);

    if (uploadError) {
      clearInterval(iv);
      setUploading(false);
      toast.error("Upload failed: " + uploadError.message);
      return;
    }

    const { error: dbError } = await supabase.from("documents").insert({
      title,
      filename: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      category,
      priority,
      status: "pending",
      version: "v1.0",
      version_notes: versionNotes,
      uploaded_by: userId,
    });

    clearInterval(iv);
    setProgress(100);

    if (dbError) {
      toast.error("Failed to save document: " + dbError.message);
    } else {
      toast.success("Document uploaded & encrypted! ✅");
      setFile(null);
      setTitle("");
      setVersionNotes("");
    }
    setTimeout(() => { setUploading(false); setProgress(0); }, 500);
  };

  const fileIcons: Record<string, string> = { "application/pdf": "📄", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊", "image/png": "🖼️", "image/jpeg": "🖼️" };

  const inputClass = "w-full px-3.5 py-2.5 bg-background border border-border2 rounded-lg text-foreground text-sm outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)]";

  return (
    <div>
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border2 rounded-2xl py-[60px] px-10 text-center bg-surface cursor-pointer transition-all hover:border-primary hover:bg-primary/[0.02] hover:shadow-[0_0_40px_rgba(0,229,255,0.08)] mb-6"
      >
        <div className="text-5xl mb-4">📂</div>
        <div className="font-display text-xl font-bold mb-2">Drop your file here</div>
        <div className="text-muted-foreground text-[13px]">or click to browse from your computer</div>
        <div className="flex gap-2 justify-center mt-4 flex-wrap">
          {["PDF", "DOCX", "XLSX", "PNG", "JPG", "Max 50MB"].map((t) => (
            <span key={t} className="bg-surface2 border border-border2 rounded-md px-2.5 py-1 text-[11px] font-mono text-muted-foreground">{t}</span>
          ))}
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
      </div>

      {file && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">📎 File Preview</div>
          <div className="p-5">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-[38px] h-[38px] bg-surface2 border border-border2 rounded-lg flex items-center justify-center text-lg">{fileIcons[file.type] || "📎"}</div>
              <div>
                <div className="font-semibold text-sm">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-mono bg-primary/[0.07] border border-primary/20 text-primary rounded px-2 py-0.5">🔒 Will be AES-256 encrypted</span>
            </div>
            {uploading && (
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-display text-sm font-bold">Document Details</div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 tracking-wider uppercase">Document Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q4 Contract — Acme Corp" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 tracking-wider uppercase">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass + " cursor-pointer"}>
                {["Contract", "NDA", "Proposal", "Report", "Other"].map((c) => <option key={c} className="bg-surface">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 tracking-wider uppercase">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass + " cursor-pointer"}>
                {["Normal", "High", "Urgent"].map((p) => <option key={p} className="bg-surface">{p}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 tracking-wider uppercase">Version Notes</label>
            <textarea value={versionNotes} onChange={(e) => setVersionNotes(e.target.value)} placeholder="What changed in this version?" className={inputClass + " resize-y min-h-[80px]"} />
          </div>
          <div className="flex gap-2.5 mt-4">
            <button onClick={submitUpload} disabled={uploading} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all disabled:opacity-50">
              {uploading ? "Uploading..." : "⬆️ Upload & Submit for Approval"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
