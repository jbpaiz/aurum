-- Adiciona campo de distância (km) para atividades físicas
ALTER TABLE public.health_activities
  ADD COLUMN IF NOT EXISTS distance_km DECIMAL(6,2) CHECK (distance_km >= 0);

COMMENT ON COLUMN public.health_activities.distance_km IS 'Distância percorrida na atividade, em quilômetros (km)';
