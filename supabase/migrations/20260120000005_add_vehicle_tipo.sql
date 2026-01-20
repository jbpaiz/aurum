-- Migration: Add tipo field to vehicles
-- Description: Adds vehicle type classification (car or motorcycle)
-- Date: 2026-01-20

-- Add new column to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'carro';

-- Add check constraint for valid values
ALTER TABLE public.vehicles
ADD CONSTRAINT check_tipo_values 
CHECK (tipo IN ('carro', 'moto'));

-- Add comment for documentation
COMMENT ON COLUMN public.vehicles.tipo IS 'Tipo do veículo (carro, moto)';

-- Update existing records to have default value
UPDATE public.vehicles
SET tipo = 'carro'
WHERE tipo IS NULL;
