
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'approver', 'client');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'client')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT DEFAULT 0,
  file_type TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Other',
  priority TEXT NOT NULL DEFAULT 'Normal',
  status TEXT NOT NULL DEFAULT 'draft',
  version TEXT NOT NULL DEFAULT 'v1.0',
  version_notes TEXT DEFAULT '',
  assigned_approver UUID REFERENCES auth.users(id),
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all docs" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert docs" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Owners and approvers can update docs" ON public.documents FOR UPDATE TO authenticated 
  USING (auth.uid() = uploaded_by OR auth.uid() = assigned_approver OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Owners and admins can delete docs" ON public.documents FOR DELETE TO authenticated 
  USING (auth.uid() = uploaded_by OR public.get_user_role(auth.uid()) = 'admin');

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comments" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  detail TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger to log document changes
CREATE OR REPLACE FUNCTION public.log_document_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = COALESCE(NEW.uploaded_by, OLD.uploaded_by);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (action, detail, user_id, user_email)
    VALUES ('UPLOAD', 'Uploaded ' || NEW.filename || ' (' || NEW.version || ') · ' || NEW.file_type, NEW.uploaded_by, COALESCE(_email, ''));
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.audit_logs (action, detail, user_id, user_email)
    VALUES (
      CASE WHEN NEW.status = 'approved' THEN 'APPROVE' WHEN NEW.status = 'rejected' THEN 'REJECT' ELSE 'UPDATE' END,
      CASE WHEN NEW.status = 'approved' THEN 'Approved ' WHEN NEW.status = 'rejected' THEN 'Rejected ' ELSE 'Updated ' END || NEW.filename,
      COALESCE(NEW.assigned_approver, NEW.uploaded_by),
      COALESCE(_email, '')
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_document_change
  AFTER INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.log_document_change();

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Auth users can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Auth users can read documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
