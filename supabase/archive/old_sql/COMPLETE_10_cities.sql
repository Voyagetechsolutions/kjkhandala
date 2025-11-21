-- =====================================================
-- COMPLETE 10 - CITIES TABLE
-- =====================================================

-- Create cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_cities_name ON public.cities(name);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Cities are viewable by everyone" ON public.cities
  FOR SELECT USING (true);

CREATE POLICY "Cities can be inserted by authenticated users" ON public.cities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Cities can be updated by authenticated users" ON public.cities
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Cities can be deleted by authenticated users" ON public.cities
  FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_cities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cities_updated_at();

-- Insert sample cities
INSERT INTO public.cities (name) VALUES
  ('Gaborone'),
  ('Francistown'),
  ('Maun'),
  ('Kasane'),
  ('Palapye'),
  ('Serowe'),
  ('Molepolole'),
  ('Kanye'),
  ('Mochudi'),
  ('Mahalapye'),
  ('Lobatse'),
  ('Selibe Phikwe'),
  ('Jwaneng'),
  ('Orapa'),
  ('Ghanzi')
ON CONFLICT (name) DO NOTHING;
