-- Migration: create diagrams table for Flow (Diagram Studio)

CREATE TABLE IF NOT EXISTS public.diagrams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text,
  nodes jsonb NOT NULL,
  edges jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security and policies so users can only access their own diagrams
ALTER TABLE public.diagrams
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diagrams are owned by user" ON public.diagrams
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.diagrams;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.diagrams
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at();
