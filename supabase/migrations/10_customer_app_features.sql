-- Customer App Additional Features
-- Tables for saved passengers, payment methods, and favorite routes

-- Saved Passengers Table
CREATE TABLE IF NOT EXISTS saved_passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  id_number VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  date_of_birth DATE,
  relationship VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Payment Methods Table
CREATE TABLE IF NOT EXISTS saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('card', 'mobile_money', 'bank_account')),
  
  -- Card details (for card type)
  card_last_four VARCHAR(4),
  card_holder VARCHAR(255),
  expiry_date VARCHAR(7), -- MM/YYYY
  
  -- Mobile money details
  mobile_number VARCHAR(20),
  wallet_provider VARCHAR(50),
  
  -- Bank account details
  account_number VARCHAR(50),
  bank_name VARCHAR(100),
  
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorite Routes Table
CREATE TABLE IF NOT EXISTS favorite_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  nickname VARCHAR(100), -- e.g., "Home to Work"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, route_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_passengers_user_id ON saved_passengers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user_id ON saved_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_routes_user_id ON favorite_routes(user_id);

-- RLS Policies

-- Saved Passengers Policies
ALTER TABLE saved_passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved passengers"
  ON saved_passengers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved passengers"
  ON saved_passengers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved passengers"
  ON saved_passengers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved passengers"
  ON saved_passengers FOR DELETE
  USING (auth.uid() = user_id);

-- Saved Payment Methods Policies
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment methods"
  ON saved_payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
  ON saved_payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON saved_payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON saved_payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- Favorite Routes Policies
ALTER TABLE favorite_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorite routes"
  ON favorite_routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite routes"
  ON favorite_routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite routes"
  ON favorite_routes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE saved_payment_methods
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON saved_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_passengers_updated_at
  BEFORE UPDATE ON saved_passengers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_payment_methods_updated_at
  BEFORE UPDATE ON saved_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
