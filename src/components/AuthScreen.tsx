import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthScreenProps {
  onLogin: () => void;
}

const AuthScreen = ({ onLogin }: AuthScreenProps) => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [role, setRole] = useState<"client" | "approver" | "admin">("client");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back! 👋");
    onLogin();
  };

  const handleRegister = async () => {
    if (!firstName || !regEmail || !regPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { first_name: firstName, last_name: lastName, role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! You can now log in. ✅");
    setTab("login");
    setEmail(regEmail);
    setPassword(regPassword);
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-background border border-border2 rounded-md text-foreground text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="min-h-screen flex items-center justify-center relative gradient-glow">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="relative z-10 w-[400px] max-w-[90vw] bg-surface border border-border2 rounded-lg p-8 shadow-xl animate-fade-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="font-display font-bold text-lg tracking-tight">
            Secure<span className="text-primary">Vault</span>
          </div>
        </div>

        <h1 className="font-display text-2xl font-semibold mb-1">
          {tab === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {tab === "login" ? "Enter your credentials to access documents" : "Register to get started"}
        </p>

        <div className="flex gap-1 bg-background rounded-md p-1 mb-6">
          <button onClick={() => setTab("login")} className={`flex-1 py-2 rounded text-[13px] font-medium transition-all ${tab === "login" ? "bg-surface2 text-foreground shadow-sm" : "text-muted-foreground"}`}>Sign In</button>
          <button onClick={() => setTab("register")} className={`flex-1 py-2 rounded text-[13px] font-medium transition-all ${tab === "register" ? "bg-surface2 text-foreground shadow-sm" : "text-muted-foreground"}`}>Register</button>
        </div>

        {tab === "login" ? (
          <div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@company.com" className={inputClass} />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className={inputClass} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            </div>
            <button onClick={handleLogin} disabled={loading} className="w-full py-2.5 bg-primary rounded-md text-primary-foreground font-medium text-sm mt-2 transition-all hover:opacity-90 disabled:opacity-50">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div className="mb-3">
                <label className="block text-xs font-medium text-muted-foreground mb-2">First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className={inputClass} />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-muted-foreground mb-2">Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={inputClass} />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Email</label>
              <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="john@company.com" className={inputClass} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as any)} className={inputClass + " cursor-pointer"}>
                <option value="client" className="bg-surface">Client</option>
                <option value="approver" className="bg-surface">Approver</option>
                <option value="admin" className="bg-surface">Admin</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Password</label>
              <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min 6 characters" className={inputClass} />
            </div>
            <button onClick={handleRegister} disabled={loading} className="w-full py-2.5 bg-primary rounded-md text-primary-foreground font-medium text-sm mt-2 transition-all hover:opacity-90 disabled:opacity-50">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-center text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">AES-256</span>
          <span className="w-px h-3 bg-border"></span>
          <span className="flex items-center gap-1">SSL/TLS</span>
          <span className="w-px h-3 bg-border"></span>
          <span className="flex items-center gap-1">SOC 2</span>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
