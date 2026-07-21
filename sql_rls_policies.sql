-- Habilitar RLS (Segurança) nas tabelas principais
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontos ENABLE ROW LEVEL SECURITY;

-- Conceder Acesso Total aos Administradores
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['clients', 'servicos', 'transactions', 'appointments', 'tasks', 'pontos']) LOOP
        -- Remove políticas anteriores (caso existam)
        EXECUTE format('DROP POLICY IF EXISTS "Permitir acesso total para administradores" ON public.%I', tbl);
        
        -- Cria nova política de acesso irrestrito para os administradores (Caetano, Vagner, Lucas)
        EXECUTE format('CREATE POLICY "Permitir acesso total para administradores" ON public.%I FOR ALL USING (
            auth.jwt() ->> ''email'' IN (''caetanomentor360@gmail.com'', ''vagnergestor360@gmail.com'', ''lucasBateraloka@gmail.com'')
        ) WITH CHECK (
            auth.jwt() ->> ''email'' IN (''caetanomentor360@gmail.com'', ''vagnergestor360@gmail.com'', ''lucasBateraloka@gmail.com'')
        )', tbl);
    END LOOP;
END
$$;
