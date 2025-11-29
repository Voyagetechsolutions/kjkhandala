-- Create payments table for DPO Pay integration
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    
    -- DPO Pay Transaction Details
    dpo_trans_token TEXT UNIQUE,
    dpo_trans_ref TEXT,
    dpo_company_ref TEXT NOT NULL UNIQUE,
    
    -- Payment Information
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BWP',
    payment_method TEXT CHECK (payment_method IN ('card', 'mobile_money', 'bank_transfer', 'cash')),
    
    -- Transaction Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded',
        'partially_refunded'
    )),
    
    -- Customer Details (from DPO)
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    customer_city TEXT,
    customer_country TEXT,
    
    -- Card Details (last 4 digits only)
    card_last4 TEXT,
    card_type TEXT,
    
    -- Transaction Details
    transaction_approval TEXT,
    transaction_net_amount DECIMAL(10, 2),
    transaction_settlement_date DATE,
    
    -- Fraud Detection
    fraud_alert TEXT,
    fraud_explanation TEXT,
    
    -- Mobile Money Details
    mobile_network TEXT,
    mobile_number TEXT,
    mobile_instructions TEXT,
    
    -- Refund Information
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_reason TEXT,
    refund_date TIMESTAMPTZ,
    refunded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Metadata
    payment_date TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create payment_attempts table for tracking all payment attempts
CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    
    -- Attempt Details
    attempt_number INTEGER NOT NULL DEFAULT 1,
    payment_method TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BWP',
    
    -- DPO Response
    dpo_trans_token TEXT,
    dpo_result_code TEXT,
    dpo_result_explanation TEXT,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('initiated', 'success', 'failed', 'cancelled')),
    error_message TEXT,
    
    -- Timestamps
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB
);

-- Create payment_webhooks table for storing DPO webhook callbacks
CREATE TABLE IF NOT EXISTS public.payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Webhook Data
    dpo_trans_token TEXT,
    dpo_trans_ref TEXT,
    dpo_company_ref TEXT,
    
    -- Payload
    webhook_type TEXT NOT NULL CHECK (webhook_type IN ('payment_success', 'payment_failed', 'refund', 'other')),
    raw_payload JSONB NOT NULL,
    
    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    
    -- Audit
    received_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT
);

-- Add payment_id to bookings table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_dpo_token ON public.payments(dpo_trans_token);
CREATE INDEX IF NOT EXISTS idx_payments_dpo_ref ON public.payments(dpo_trans_ref);
CREATE INDEX IF NOT EXISTS idx_payments_company_ref ON public.payments(dpo_company_ref);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON public.payments(customer_email);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_payment ON public.payment_attempts(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_booking ON public.payment_attempts(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON public.payment_attempts(status);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_token ON public.payment_webhooks(dpo_trans_token);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON public.payment_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_received ON public.payment_webhooks(received_at);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = payments.booking_id
            AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all payments" ON public.payments
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'finance_manager', 'ticketing_agent')
        )
    );

CREATE POLICY "Staff can manage payments" ON public.payments
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'finance_manager', 'ticketing_agent')
        )
    );

-- RLS Policies for payment_attempts
CREATE POLICY "Users can view their own payment attempts" ON public.payment_attempts
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = payment_attempts.booking_id
            AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all payment attempts" ON public.payment_attempts
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'finance_manager', 'ticketing_agent')
        )
    );

-- RLS Policies for payment_webhooks
CREATE POLICY "Only admins can view webhooks" ON public.payment_webhooks
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'finance_manager')
        )
    );

-- Create function to update payment status
CREATE OR REPLACE FUNCTION update_booking_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When payment is completed, update booking status
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.bookings
        SET 
            payment_status = 'paid',
            status = CASE 
                WHEN status = 'pending' THEN 'confirmed'
                ELSE status
            END,
            payment_id = NEW.id
        WHERE id = NEW.booking_id;
    END IF;
    
    -- When payment is failed or cancelled, update booking
    IF NEW.status IN ('failed', 'cancelled') AND OLD.status NOT IN ('failed', 'cancelled') THEN
        UPDATE public.bookings
        SET payment_status = 'failed'
        WHERE id = NEW.booking_id;
    END IF;
    
    -- When payment is refunded, update booking
    IF NEW.status IN ('refunded', 'partially_refunded') AND OLD.status NOT IN ('refunded', 'partially_refunded') THEN
        UPDATE public.bookings
        SET 
            payment_status = 'refunded',
            status = 'cancelled'
        WHERE id = NEW.booking_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status updates
DROP TRIGGER IF EXISTS trigger_update_booking_payment_status ON public.payments;
CREATE TRIGGER trigger_update_booking_payment_status
    AFTER UPDATE OF status ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_payment_status();

-- Create function to generate unique company reference
CREATE OR REPLACE FUNCTION generate_company_ref()
RETURNS TEXT AS $$
DECLARE
    ref TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8 character alphanumeric reference
        ref := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
        
        -- Check if it exists
        SELECT EXISTS(SELECT 1 FROM public.payments WHERE dpo_company_ref = ref) INTO exists;
        
        EXIT WHEN NOT exists;
    END LOOP;
    
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for payment analytics
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
    DATE_TRUNC('day', payment_date) as payment_day,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_transactions,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_transactions,
    SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
    SUM(transaction_net_amount) FILTER (WHERE status = 'completed') as net_revenue,
    SUM(refund_amount) as total_refunds,
    AVG(amount) FILTER (WHERE status = 'completed') as average_transaction,
    payment_method,
    currency
FROM public.payments
WHERE payment_date IS NOT NULL
GROUP BY DATE_TRUNC('day', payment_date), payment_method, currency
ORDER BY payment_day DESC;

COMMENT ON TABLE public.payments IS 'Payment transactions processed through DPO Pay gateway';
COMMENT ON TABLE public.payment_attempts IS 'Log of all payment attempts including failed ones';
COMMENT ON TABLE public.payment_webhooks IS 'DPO Pay webhook callbacks for payment notifications';
COMMENT ON VIEW payment_analytics IS 'Daily payment analytics and revenue tracking';
