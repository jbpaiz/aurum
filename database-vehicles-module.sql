-- Vehicles module DDL (Supabase/Postgres)
-- Idempotent creation for enums
DO $$ BEGIN
  CREATE TYPE vehicle_status AS ENUM ('ativo','manutencao','inativo','vendido');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('pendente','agendado','concluido','cancelado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE cost_category AS ENUM ('combustivel','manutencao','seguro','licenciamento','multa','outros');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('apolice','licenciamento','vistoria','cnh','multa','outro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Vehicles
-- Helper to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placa text UNIQUE NOT NULL,
  renavam text UNIQUE,
  modelo text NOT NULL,
  ano smallint,
  categoria text,
  status vehicle_status NOT NULL DEFAULT 'ativo',
  odometro_atual integer,
  local_atual text,
  tags text[],
  centro_custo_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_vehicles_updated
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Odometer readings (manual/telemetry)
CREATE TABLE IF NOT EXISTS odometer_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  valor integer NOT NULL CHECK (valor >= 0),
  fonte text NOT NULL, -- manual, telemetria, abastecimento
  registrado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_odometer_vehicle_time ON odometer_readings(vehicle_id, registrado_em DESC);

-- Locations (opcional: ingest de telemetria)
CREATE TABLE IF NOT EXISTS vehicle_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  local text,
  latitude double precision,
  longitude double precision,
  registrado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle_time ON vehicle_locations(vehicle_id, registrado_em DESC);

-- Drivers (vincular a users se existir)
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  nome text NOT NULL,
  cnh_numero text,
  cnh_categoria text,
  cnh_validade date,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Histórico de vínculo veículo-condutor
CREATE TABLE IF NOT EXISTS vehicle_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vinculo_inicio timestamptz NOT NULL DEFAULT now(),
  vinculo_fim timestamptz
);
CREATE INDEX IF NOT EXISTS idx_vehicle_drivers_vehicle ON vehicle_drivers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_drivers_driver ON vehicle_drivers(driver_id);

-- Templates de manutenção preventiva
CREATE TABLE IF NOT EXISTS maintenance_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('km','data')),
  intervalo_km integer,
  intervalo_dias integer,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Eventos de manutenção
CREATE TABLE IF NOT EXISTS maintenance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES maintenance_templates(id),
  titulo text NOT NULL,
  odometro_previsto integer,
  data_prevista date,
  odometro_realizado integer,
  data_realizada date,
  custo numeric(14,2),
  status maintenance_status NOT NULL DEFAULT 'pendente',
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_maint_events_vehicle ON maintenance_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maint_events_status ON maintenance_events(status);

-- Incidentes / sinistros / avarias
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  data date NOT NULL,
  tipo text,
  custo_estimado numeric(14,2),
  custo_real numeric(14,2),
  descricao text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_incidents_vehicle ON incidents(vehicle_id);

-- Abastecimentos
CREATE TABLE IF NOT EXISTS fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id),
  odometro integer NOT NULL,
  litros numeric(10,2) NOT NULL CHECK (litros > 0),
  valor_total numeric(14,2) NOT NULL CHECK (valor_total >= 0),
  preco_litro numeric(10,3),
  posto text,
  metodo_pagamento text,
  data timestamptz NOT NULL DEFAULT now(),
  notas text
);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_date ON fuel_logs(vehicle_id, data DESC);

-- Custos diversos vinculados
CREATE TABLE IF NOT EXISTS cost_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  categoria cost_category NOT NULL,
  valor numeric(14,2) NOT NULL,
  data date NOT NULL DEFAULT current_date,
  referencia_id uuid,
  referencia_tabela text,
  notas text
);
CREATE INDEX IF NOT EXISTS idx_cost_items_vehicle_date ON cost_items(vehicle_id, data DESC);

-- Documentos
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  tipo document_type NOT NULL,
  numero text,
  validade date,
  arquivo_url text,
  status text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_vehicle ON documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_documents_validade ON documents(validade);

-- Anexos genéricos
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type text NOT NULL,
  parent_id uuid NOT NULL,
  url text NOT NULL,
  mime text,
  legenda text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_parent ON attachments(parent_type, parent_id);

-- Multas / infrações
CREATE TABLE IF NOT EXISTS fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  auto_infracao text,
  orgao text,
  data date NOT NULL,
  valor numeric(14,2) NOT NULL,
  pontos smallint,
  status text NOT NULL DEFAULT 'recebida',
  vencimento date,
  comprovante_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fines_vehicle ON fines(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);
CREATE INDEX IF NOT EXISTS idx_fines_vencimento ON fines(vencimento);

-- Views auxiliares básicas
CREATE OR REPLACE VIEW v_vehicle_consumo AS
SELECT
  f.vehicle_id,
  f.data::date AS dia,
  f.odometro,
  f.litros,
  f.valor_total,
  lag(f.odometro) OVER (PARTITION BY f.vehicle_id ORDER BY f.data, f.id) AS odometro_anterior,
  CASE
    WHEN lag(f.odometro) OVER (PARTITION BY f.vehicle_id ORDER BY f.data, f.id) IS NULL THEN NULL
    ELSE (f.odometro - lag(f.odometro) OVER (PARTITION BY f.vehicle_id ORDER BY f.data, f.id))::numeric / NULLIF(f.litros,0)
  END AS km_por_litro,
  CASE
    WHEN lag(f.odometro) OVER (PARTITION BY f.vehicle_id ORDER BY f.data, f.id) IS NULL THEN NULL
    ELSE f.valor_total / NULLIF((f.odometro - lag(f.odometro) OVER (PARTITION BY f.vehicle_id ORDER BY f.data, f.id))::numeric,0)
  END AS custo_por_km
FROM fuel_logs f;

CREATE OR REPLACE VIEW v_vehicle_custos AS
SELECT
  vehicle_id,
  categoria,
  date_trunc('month', data)::date AS mes,
  SUM(valor) AS total
FROM cost_items
GROUP BY vehicle_id, categoria, date_trunc('month', data);

-- Próximas manutenções (simples: por data ou km)
CREATE OR REPLACE VIEW v_vehicle_proximas_manutencoes AS
SELECT
  v.id AS vehicle_id,
  mt.id AS template_id,
  mt.nome,
  mt.tipo,
  CASE WHEN mt.tipo = 'km' AND v.odometro_atual IS NOT NULL AND mt.intervalo_km IS NOT NULL
    THEN v.odometro_atual + mt.intervalo_km
  END AS proxima_km,
  CASE WHEN mt.tipo = 'data' AND mt.intervalo_dias IS NOT NULL
    THEN current_date + mt.intervalo_dias
  END AS proxima_data
FROM vehicles v
CROSS JOIN maintenance_templates mt
WHERE mt.ativo = true;

-- Helpers: update odometro_atual when inserting readings
CREATE OR REPLACE FUNCTION trg_update_vehicle_odometer()
RETURNS trigger AS $$
BEGIN
  UPDATE vehicles SET odometro_atual = GREATEST(COALESCE(odometro_atual,0), NEW.valor), updated_at = now()
  WHERE id = NEW.vehicle_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_odometer_update
AFTER INSERT ON odometer_readings
FOR EACH ROW EXECUTE FUNCTION trg_update_vehicle_odometer();
