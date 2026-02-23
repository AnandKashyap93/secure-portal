import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import AuthScreen from "@/components/AuthScreen";
import AppLayout, { type Page } from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import DocumentsPage from "@/pages/DocumentsPage";
import UploadPage from "@/pages/UploadPage";
import VersionsPage from "@/pages/VersionsPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import CommentsPage from "@/pages/CommentsPage";
import AuditPage from "@/pages/AuditPage";
import ReportsPage from "@/pages/ReportsPage";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [profile, setProfile] = useState<{ first_name: string; last_name: string; role: string } | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) { setProfile(null); return; }
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("first_name, last_name, role").eq("user_id", session.user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onLogin={() => {}} />;
  }

  const userId = session.user.id;
  const userEmail = session.user.email || "";
  const userName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : userEmail;
  const userRole = profile?.role || "client";

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <DashboardPage onNavigate={(p) => setCurrentPage(p as Page)} />;
      case "documents": return <DocumentsPage />;
      case "upload": return <UploadPage userId={userId} />;
      case "versions": return <VersionsPage />;
      case "approvals": return <ApprovalsPage userId={userId} />;
      case "comments": return <CommentsPage userId={userId} userEmail={userEmail} />;
      case "audit": return <AuditPage />;
      case "reports": return <ReportsPage />;
      default: return <DashboardPage onNavigate={(p) => setCurrentPage(p as Page)} />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onPageChange={setCurrentPage} userName={userName} userRole={userRole} userEmail={userEmail}>
      {renderPage()}
    </AppLayout>
  );
};

export default Index;
