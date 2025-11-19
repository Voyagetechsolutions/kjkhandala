-- Trip Ratings Table for customer feedback

CREATE TABLE IF NOT EXISTS trip_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_trip_ratings_trip_id ON trip_ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_ratings_user_id ON trip_ratings(user_id);

-- RLS Policies
ALTER TABLE trip_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings"
  ON trip_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own ratings"
  ON trip_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON trip_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON trip_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Add refund fields to bookings table if they don't exist
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) CHECK (refund_status IN ('pending', 'approved', 'processed', 'rejected', 'not_applicable')),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;

-- Update timestamp trigger
CREATE TRIGGER update_trip_ratings_updated_at
  BEFORE UPDATE ON trip_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
