-- 1. Criação das tabelas necessárias
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  nome TEXT,
  email TEXT,
  telefone TEXT,
  user_id UUID
);

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  nome TEXT,
  descricao TEXT,
  preco TEXT,
  user_id UUID
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  tipo TEXT,
  valor NUMERIC,
  descricao TEXT,
  data DATE,
  status TEXT,
  cliente_id TEXT,
  user_id UUID,
  editor_nome TEXT
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  cliente_id TEXT,
  data DATE,
  titulo TEXT,
  user_id UUID
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  titulo TEXT,
  descricao TEXT,
  data DATE,
  status TEXT,
  is_recurring BOOLEAN,
  updated_at TIMESTAMPTZ,
  user_id UUID
);

CREATE TABLE IF NOT EXISTS public.pontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  usuario_email TEXT,
  usuario_nome TEXT,
  tipo TEXT,
  data_hora TIMESTAMPTZ,
  latitude NUMERIC,
  longitude NUMERIC,
  localizacao_valida BOOLEAN
);

-- 2. Habilitar RLS (Segurança) em todas as tabelas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontos ENABLE ROW LEVEL SECURITY;

-- 3. Conceder Acesso Total aos Administradores
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['clients', 'services', 'transactions', 'appointments', 'tasks', 'pontos']) LOOP
        -- Remove políticas anteriores
        EXECUTE format('DROP POLICY IF EXISTS "Permitir acesso total para administradores" ON public.%I', tbl);
        
        -- Cria nova política de acesso irrestrito
        EXECUTE format('CREATE POLICY "Permitir acesso total para administradores" ON public.%I FOR ALL USING (
            auth.jwt() ->> ''email'' IN (''caetanomentor360@gmail.com'', ''vagnergestor360@gmail.com'', ''lucasBateraloka@gmail.com'')
        ) WITH CHECK (
            auth.jwt() ->> ''email'' IN (''caetanomentor360@gmail.com'', ''vagnergestor360@gmail.com'', ''lucasBateraloka@gmail.com'')
        )', tbl);
    END LOOP;
END
$$;
