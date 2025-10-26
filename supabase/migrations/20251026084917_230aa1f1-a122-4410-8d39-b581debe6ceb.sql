-- Add route type enum
CREATE TYPE public.route_type AS ENUM ('local', 'cross_border');

-- Add route_type column to routes table
ALTER TABLE public.routes 
ADD COLUMN route_type route_type NOT NULL DEFAULT 'local';

-- Create booking_offices table
CREATE TABLE public.booking_offices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  operating_hours TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on booking_offices
ALTER TABLE public.booking_offices ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active booking offices
CREATE POLICY "Anyone can view active booking offices"
ON public.booking_offices
FOR SELECT
USING (active = true);

-- Allow admins to manage booking offices
CREATE POLICY "Admins can manage booking offices"
ON public.booking_offices
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on booking_offices
CREATE TRIGGER update_booking_offices_updated_at
BEFORE UPDATE ON public.booking_offices
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();