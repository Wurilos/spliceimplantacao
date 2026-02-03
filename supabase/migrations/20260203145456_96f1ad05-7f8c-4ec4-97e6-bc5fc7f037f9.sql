-- Enum para tipos de role
CREATE TYPE public.app_role AS ENUM ('admin', 'operador', 'consulta');

-- Enum para tipos de sinalização horizontal
CREATE TYPE public.sinalizacao_horizontal_tipo AS ENUM ('defensa_metalica', 'tae_80', 'tae_100');

-- Tabela de user_roles (RBAC)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'consulta',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de contratos
CREATE TABLE public.contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_contrato TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de sentidos
CREATE TABLE public.sentidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de equipamentos
CREATE TABLE public.equipamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID REFERENCES public.contratos(id) ON DELETE CASCADE NOT NULL,
    numero_serie TEXT NOT NULL,
    municipio TEXT NOT NULL,
    endereco TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    tem_sinalizacao_vertical BOOLEAN DEFAULT false,
    tem_sinalizacao_horizontal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de junção equipamento_sentidos
CREATE TABLE public.equipamento_sentidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE CASCADE NOT NULL,
    sentido_id UUID REFERENCES public.sentidos(id) ON DELETE CASCADE NOT NULL,
    is_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (equipamento_id, sentido_id)
);

-- Tabela de sinalização vertical (blocos)
CREATE TABLE public.sinalizacao_vertical_blocos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE CASCADE NOT NULL,
    sentido_id UUID REFERENCES public.sentidos(id) ON DELETE SET NULL,
    endereco TEXT NOT NULL,
    tipo TEXT NOT NULL,
    subtipo TEXT NOT NULL, -- 'equipamento' ou 'aproximacao'
    instalacao TEXT NOT NULL, -- 'solo' ou 'aerea'
    lado TEXT NOT NULL, -- 'D' ou 'E'
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    foto_url TEXT,
    qtd_pontaletes INTEGER DEFAULT 0,
    qtd_perfis_metalicos INTEGER DEFAULT 0,
    qtd_postes_colapsiveis INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de sinalização horizontal (itens)
CREATE TABLE public.sinalizacao_horizontal_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE CASCADE NOT NULL,
    sentido_id UUID REFERENCES public.sentidos(id) ON DELETE SET NULL,
    tipo sinalizacao_horizontal_tipo NOT NULL,
    endereco TEXT NOT NULL,
    lado TEXT NOT NULL, -- 'D' ou 'E'
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    foto_url TEXT,
    qtd_laminas INTEGER DEFAULT 0,
    qtd_postes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamento_sentidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinalizacao_vertical_blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinalizacao_horizontal_itens ENABLE ROW LEVEL SECURITY;

-- Função para verificar role (Security Definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é admin ou operador
CREATE OR REPLACE FUNCTION public.can_edit(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'operador')
  )
$$;

-- Função para verificar se é admin (pode deletar)
CREATE OR REPLACE FUNCTION public.can_delete(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Trigger para criar profile e role automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- Atribuir role padrão de consulta para novos usuários
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'consulta');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipamentos_updated_at BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sinalizacao_vertical_updated_at BEFORE UPDATE ON public.sinalizacao_vertical_blocos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sinalizacao_horizontal_updated_at BEFORE UPDATE ON public.sinalizacao_horizontal_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies para user_roles (apenas admin pode gerenciar)
CREATE POLICY "Anyone authenticated can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.can_delete(auth.uid()));
CREATE POLICY "Admin can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.can_delete(auth.uid()));
CREATE POLICY "Admin can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.can_delete(auth.uid()));

-- RLS Policies para contratos
CREATE POLICY "Anyone authenticated can view contratos" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Operador can insert contratos" ON public.contratos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Admin/Operador can update contratos" ON public.contratos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "Admin can delete contratos" ON public.contratos FOR DELETE TO authenticated USING (public.can_delete(auth.uid()));

-- RLS Policies para sentidos
CREATE POLICY "Anyone authenticated can view sentidos" ON public.sentidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Operador can insert sentidos" ON public.sentidos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Admin/Operador can update sentidos" ON public.sentidos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "Admin can delete sentidos" ON public.sentidos FOR DELETE TO authenticated USING (public.can_delete(auth.uid()));

-- RLS Policies para equipamentos
CREATE POLICY "Anyone authenticated can view equipamentos" ON public.equipamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Operador can insert equipamentos" ON public.equipamentos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Admin/Operador can update equipamentos" ON public.equipamentos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "Admin can delete equipamentos" ON public.equipamentos FOR DELETE TO authenticated USING (public.can_delete(auth.uid()));

-- RLS Policies para equipamento_sentidos
CREATE POLICY "Anyone authenticated can view equipamento_sentidos" ON public.equipamento_sentidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Operador can insert equipamento_sentidos" ON public.equipamento_sentidos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Admin/Operador can update equipamento_sentidos" ON public.equipamento_sentidos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "Admin can delete equipamento_sentidos" ON public.equipamento_sentidos FOR DELETE TO authenticated USING (public.can_delete(auth.uid()));

-- RLS Policies para sinalizacao_vertical_blocos
CREATE POLICY "Anyone authenticated can view sinalizacao_vertical" ON public.sinalizacao_vertical_blocos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Operador can insert sinalizacao_vertical" ON public.sinalizacao_vertical_blocos FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Admin/Operador can update sinalizacao_vertical" ON public.sinalizacao_vertical_blocos FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "Admin can delete sinalizacao_vertical" ON public.sinalizacao_vertical_blocos FOR DELETE TO authenticated USING (public.can_delete(auth.uid()));

-- RLS Policies para sinalizacao_horizontal_itens
CREATE POLICY "Anyone authenticated can view sinalizacao_horizontal" ON public.sinalizacao_horizontal_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Operador can insert sinalizacao_horizontal" ON public.sinalizacao_horizontal_itens FOR INSERT TO authenticated WITH CHECK (public.can_edit(auth.uid()));
CREATE POLICY "Admin/Operador can update sinalizacao_horizontal" ON public.sinalizacao_horizontal_itens FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()));
CREATE POLICY "Admin can delete sinalizacao_horizontal" ON public.sinalizacao_horizontal_itens FOR DELETE TO authenticated USING (public.can_delete(auth.uid()));

-- Criar bucket para fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos', 'fotos', true);

-- Storage policies para bucket de fotos
CREATE POLICY "Anyone can view fotos" ON storage.objects FOR SELECT USING (bucket_id = 'fotos');
CREATE POLICY "Authenticated users can upload fotos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos');
CREATE POLICY "Authenticated users can update fotos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'fotos');
CREATE POLICY "Admin can delete fotos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'fotos');

-- Inserir sentidos padrão
INSERT INTO public.sentidos (nome) VALUES 
  ('Norte'),
  ('Sul'),
  ('Leste'),
  ('Oeste'),
  ('Nordeste'),
  ('Noroeste'),
  ('Sudeste'),
  ('Sudoeste');