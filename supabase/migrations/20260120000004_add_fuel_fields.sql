-- Migration: Add bandeira and tipo_combustivel fields to fuel_logs
-- Description: Adds brand and fuel type tracking to fuel log entries
-- Date: 2026-01-20

-- Add new columns to fuel_logs table
ALTER TABLE public.fuel_logs
ADD COLUMN IF NOT EXISTS bandeira TEXT,
ADD COLUMN IF NOT EXISTS tipo_combustivel TEXT;

-- Clean up any invalid data before adding constraints
-- Convert empty strings to NULL
UPDATE public.fuel_logs
SET bandeira = NULL
WHERE bandeira = '';

UPDATE public.fuel_logs
SET tipo_combustivel = NULL
WHERE tipo_combustivel = '';

-- Convert any invalid values to NULL
UPDATE public.fuel_logs
SET bandeira = NULL
WHERE bandeira IS NOT NULL 
  AND bandeira NOT IN ('shell', 'petrobras', 'ipiranga', 'raizen', 'ale', 'bp', 'outro');

UPDATE public.fuel_logs
SET tipo_combustivel = NULL
WHERE tipo_combustivel IS NOT NULL 
  AND tipo_combustivel NOT IN ('gasolina', 'etanol', 'diesel', 'diesel_s10', 'gnv', 'gasolina_aditivada');

-- Drop existing constraints if they exist
ALTER TABLE public.fuel_logs
DROP CONSTRAINT IF EXISTS check_bandeira_values;

ALTER TABLE public.fuel_logs
DROP CONSTRAINT IF EXISTS check_tipo_combustivel_values;

-- Add check constraints for valid values
ALTER TABLE public.fuel_logs
ADD CONSTRAINT check_bandeira_values 
CHECK (bandeira IS NULL OR bandeira IN ('shell', 'petrobras', 'ipiranga', 'raizen', 'ale', 'bp', 'outro'));

ALTER TABLE public.fuel_logs
ADD CONSTRAINT check_tipo_combustivel_values 
CHECK (tipo_combustivel IS NULL OR tipo_combustivel IN ('gasolina', 'etanol', 'diesel', 'diesel_s10', 'gnv', 'gasolina_aditivada'));

-- Add comments for documentation
COMMENT ON COLUMN public.fuel_logs.bandeira IS 'Bandeira do posto de combustível (shell, petrobras, ipiranga, raizen, ale, bp, outro)';
COMMENT ON COLUMN public.fuel_logs.tipo_combustivel IS 'Tipo de combustível abastecido (gasolina, etanol, diesel, diesel_s10, gnv, gasolina_aditivada)';

-- Make odometro nullable (it was already nullable, but documenting the intent)
ALTER TABLE public.fuel_logs
ALTER COLUMN odometro DROP NOT NULL;

COMMENT ON COLUMN public.fuel_logs.odometro IS 'Odômetro no momento do abastecimento (opcional)';
