-- Create terminals table
CREATE TABLE IF NOT EXISTS public.terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_name TEXT NOT NULL,
    terminal_code TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    city TEXT,
    capacity INTEGER DEFAULT 10,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    contact_phone TEXT,
    contact_email TEXT,
    operating_hours TEXT,
    facilities TEXT[], -- Array of facilities like ['parking', 'waiting_area', 'restrooms']
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticketing_offices table (if not exists)
CREATE TABLE IF NOT EXISTS public.ticketing_offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_name TEXT NOT NULL,
    office_code TEXT UNIQUE NOT NULL,
    terminal_id UUID REFERENCES public.terminals(id) ON DELETE SET NULL,
    location TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create terminal_gates table for managing boarding gates
CREATE TABLE IF NOT EXISTS public.terminal_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id UUID NOT NULL REFERENCES public.terminals(id) ON DELETE CASCADE,
    gate_number TEXT NOT NULL,
    gate_name TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'closed')),
    current_trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(terminal_id, gate_number)
);

-- Create terminal_activities table for logging terminal operations
CREATE TABLE IF NOT EXISTS public.terminal_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id UUID NOT NULL REFERENCES public.terminals(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('boarding', 'departure', 'arrival', 'delay', 'cancellation', 'gate_change')),
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    gate_id UUID REFERENCES public.terminal_gates(id) ON DELETE SET NULL,
    description TEXT,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add terminal_id to trips table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trips' AND column_name = 'terminal_id'
    ) THEN
        ALTER TABLE public.trips ADD COLUMN terminal_id UUID REFERENCES public.terminals(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trips' AND column_name = 'gate_id'
    ) THEN
        ALTER TABLE public.trips ADD COLUMN gate_id UUID REFERENCES public.terminal_gates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_terminals_status ON public.terminals(status);
CREATE INDEX IF NOT EXISTS idx_terminals_city ON public.terminals(city);
CREATE INDEX IF NOT EXISTS idx_ticketing_offices_terminal ON public.ticketing_offices(terminal_id);
CREATE INDEX IF NOT EXISTS idx_terminal_gates_terminal ON public.terminal_gates(terminal_id);
CREATE INDEX IF NOT EXISTS idx_terminal_gates_status ON public.terminal_gates(status);
CREATE INDEX IF NOT EXISTS idx_terminal_activities_terminal ON public.terminal_activities(terminal_id);
CREATE INDEX IF NOT EXISTS idx_terminal_activities_trip ON public.terminal_activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_terminal ON public.trips(terminal_id);
CREATE INDEX IF NOT EXISTS idx_trips_gate ON public.trips(gate_id);

-- Enable RLS
ALTER TABLE public.terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticketing_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminal_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminal_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for terminals
CREATE POLICY "Terminals are viewable by authenticated users" ON public.terminals
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Terminals are manageable by admins" ON public.terminals
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'operations_manager')
        )
    );

-- RLS Policies for ticketing_offices
CREATE POLICY "Ticketing offices are viewable by authenticated users" ON public.ticketing_offices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Ticketing offices are manageable by admins" ON public.ticketing_offices
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'operations_manager')
        )
    );

-- RLS Policies for terminal_gates
CREATE POLICY "Terminal gates are viewable by authenticated users" ON public.terminal_gates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Terminal gates are manageable by operations staff" ON public.terminal_gates
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'operations_manager', 'operations_staff')
        )
    );

-- RLS Policies for terminal_activities
CREATE POLICY "Terminal activities are viewable by authenticated users" ON public.terminal_activities
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Terminal activities are insertable by authenticated users" ON public.terminal_activities
    FOR INSERT TO authenticated WITH CHECK (true);

-- Create function to update terminal gate status
CREATE OR REPLACE FUNCTION update_gate_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When a trip is assigned to a gate, mark gate as occupied
    IF NEW.gate_id IS NOT NULL AND NEW.status IN ('BOARDING', 'SCHEDULED') THEN
        UPDATE public.terminal_gates
        SET status = 'occupied', current_trip_id = NEW.id
        WHERE id = NEW.gate_id;
    END IF;
    
    -- When a trip departs or is cancelled, free up the gate
    IF OLD.gate_id IS NOT NULL AND NEW.status IN ('DEPARTED', 'COMPLETED', 'CANCELLED') THEN
        UPDATE public.terminal_gates
        SET status = 'available', current_trip_id = NULL
        WHERE id = OLD.gate_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gate status updates
DROP TRIGGER IF EXISTS trigger_update_gate_status ON public.trips;
CREATE TRIGGER trigger_update_gate_status
    AFTER INSERT OR UPDATE OF gate_id, status ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION update_gate_status();

-- Insert sample terminals
INSERT INTO public.terminals (terminal_name, terminal_code, location, city, capacity, contact_phone, facilities) VALUES
    ('Main Terminal Gaborone', 'GAB-MAIN', 'Plot 123, Main Mall', 'Gaborone', 15, '+267 1234567', ARRAY['parking', 'waiting_area', 'restrooms', 'cafeteria', 'wifi']),
    ('Francistown Terminal', 'FRW-MAIN', 'Blue Jacket Street', 'Francistown', 10, '+267 2345678', ARRAY['parking', 'waiting_area', 'restrooms', 'wifi']),
    ('Maun Terminal', 'MUN-MAIN', 'Airport Road', 'Maun', 8, '+267 3456789', ARRAY['parking', 'waiting_area', 'restrooms'])
ON CONFLICT (terminal_code) DO NOTHING;

-- Insert sample gates for Main Terminal Gaborone
INSERT INTO public.terminal_gates (terminal_id, gate_number, gate_name, status)
SELECT 
    t.id,
    'GATE-' || gs.gate_num,
    'Gate ' || gs.gate_num,
    'available'
FROM public.terminals t
CROSS JOIN (SELECT generate_series(1, 5) AS gate_num) gs
WHERE t.terminal_code = 'GAB-MAIN'
ON CONFLICT (terminal_id, gate_number) DO NOTHING;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_terminals_updated_at ON public.terminals;
CREATE TRIGGER update_terminals_updated_at
    BEFORE UPDATE ON public.terminals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ticketing_offices_updated_at ON public.ticketing_offices;
CREATE TRIGGER update_ticketing_offices_updated_at
    BEFORE UPDATE ON public.ticketing_offices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_terminal_gates_updated_at ON public.terminal_gates;
CREATE TRIGGER update_terminal_gates_updated_at
    BEFORE UPDATE ON public.terminal_gates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.terminals IS 'Bus terminals/stations where trips originate or terminate';
COMMENT ON TABLE public.ticketing_offices IS 'Ticketing offices linked to specific terminals';
COMMENT ON TABLE public.terminal_gates IS 'Boarding gates within terminals';
COMMENT ON TABLE public.terminal_activities IS 'Log of all terminal operations and activities';
