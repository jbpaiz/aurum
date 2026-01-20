-- Add user_id to vehicles and related tables
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE fuel_logs 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE maintenance_events 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE fines 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_user_id ON fuel_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_events_user_id ON maintenance_events(user_id);
CREATE INDEX IF NOT EXISTS idx_fines_user_id ON fines(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- Enable RLS on vehicles tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE odometer_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
DROP POLICY IF EXISTS vehicles_policy ON vehicles;
CREATE POLICY vehicles_policy ON vehicles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for fuel_logs
DROP POLICY IF EXISTS fuel_logs_policy ON fuel_logs;
CREATE POLICY fuel_logs_policy ON fuel_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for maintenance_events
DROP POLICY IF EXISTS maintenance_events_policy ON maintenance_events;
CREATE POLICY maintenance_events_policy ON maintenance_events
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for fines
DROP POLICY IF EXISTS fines_policy ON fines;
CREATE POLICY fines_policy ON fines
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for documents
DROP POLICY IF EXISTS documents_policy ON documents;
CREATE POLICY documents_policy ON documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for drivers (allow users to see all drivers, but only manage their own)
DROP POLICY IF EXISTS drivers_select_policy ON drivers;
DROP POLICY IF EXISTS drivers_insert_policy ON drivers;
DROP POLICY IF EXISTS drivers_update_policy ON drivers;
DROP POLICY IF EXISTS drivers_delete_policy ON drivers;

CREATE POLICY drivers_select_policy ON drivers
  FOR SELECT
  USING (true);

CREATE POLICY drivers_insert_policy ON drivers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY drivers_update_policy ON drivers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY drivers_delete_policy ON drivers
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for odometer_readings (via vehicle ownership)
DROP POLICY IF EXISTS odometer_readings_policy ON odometer_readings;
CREATE POLICY odometer_readings_policy ON odometer_readings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = odometer_readings.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = odometer_readings.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  );

-- RLS Policies for vehicle_locations (via vehicle ownership)
DROP POLICY IF EXISTS vehicle_locations_policy ON vehicle_locations;
CREATE POLICY vehicle_locations_policy ON vehicle_locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = vehicle_locations.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = vehicle_locations.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  );
