-- Schema dos cursos, do painel e da auditoria. Idempotente: pode rodar de novo
-- sem perder dados (`npm run db:migrate`). Qualquer Postgres 13+ — Supabase,
-- Vercel Postgres/Neon ou local.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Painel: administradores, sessões, limites de tentativa
-- ---------------------------------------------------------------------------

-- Administradores criados pelo master. O master em si não mora aqui: as
-- credenciais dele ficam só nas variáveis de ambiente.
CREATE TABLE IF NOT EXISTS admins (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username             text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  display_name         text NOT NULL,
  -- scrypt:<log2N>:<r>:<p>:<sal>:<hash>
  password_hash        text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  -- Segredos TOTP cifrados com AES-256-GCM (DATA_ENCRYPTION_KEY).
  totp_secret_enc      text,
  totp_pending_enc     text,
  totp_enabled         boolean NOT NULL DEFAULT false,
  active               boolean NOT NULL DEFAULT true,
  created_by           text NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  password_changed_at  timestamptz NOT NULL DEFAULT now(),
  last_login_at        timestamptz
);

-- Sessões do painel. O cookie leva um token aleatório; aqui fica só o SHA-256
-- dele, então um vazamento do banco não entrega sessões válidas.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash   text PRIMARY KEY,
  admin_id     uuid REFERENCES admins (id) ON DELETE CASCADE,
  -- Sessão do master: guarda o usuário e uma impressão do hash de senha do
  -- .env — trocar a senha do master derruba todas as sessões dele.
  master_user  text,
  master_fp    text,
  -- 'setup' só abre a tela de troca de senha e ativação do 2FA.
  stage        text NOT NULL CHECK (stage IN ('setup', 'full')),
  ip           text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  CHECK ((admin_id IS NULL) <> (master_user IS NULL))
);

CREATE INDEX IF NOT EXISTS admin_sessions_admin_idx ON admin_sessions (admin_id);
CREATE INDEX IF NOT EXISTS admin_sessions_expires_idx ON admin_sessions (expires_at);

-- Janela fixa por chave (ex.: "login:ip:1.2.3.4"). Serve a login, checkout e
-- pedido de link de reembolso, sem depender de Redis.
CREATE TABLE IF NOT EXISTS rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count        integer NOT NULL
);

-- Último passo TOTP aceito por usuário: o mesmo código não entra duas vezes.
CREATE TABLE IF NOT EXISTS totp_replay (
  principal text PRIMARY KEY,
  last_step bigint NOT NULL
);

-- ---------------------------------------------------------------------------
-- Turmas e matrículas
-- ---------------------------------------------------------------------------

-- Curso: o conteúdo (textos, programa, materiais). Criado e editado em
-- /admin/cursos. O slug é o endereço público (/cursos/<slug>) e não muda
-- depois de criado — turmas, matrículas e certificados apontam para ele.
CREATE TABLE IF NOT EXISTS courses (
  slug         text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 60),
  -- Frente da TkxHi: define cor e textura da página do curso.
  pillar       text NOT NULL DEFAULT 'impressao-3d'
               CHECK (pillar IN ('engenharia', 'impressao-3d', 'editora')),
  title        text NOT NULL,
  edition      text NOT NULL,
  tagline      text NOT NULL,
  lead         text NOT NULL,
  authors      text NOT NULL,
  -- [{ "title", "description", "icon" }] — ícone por chave (src/lib/courses.ts).
  modules      jsonb NOT NULL DEFAULT '[]'::jsonb,
  materials    text[] NOT NULL DEFAULT '{}',
  software     text[] NOT NULL DEFAULT '{}',
  requirements text NOT NULL DEFAULT '',
  -- Chave de src/lib/photos.ts.
  photo        text NOT NULL DEFAULT 'turtleSensor',
  -- draft: invisível · published: no site · archived: fora do catálogo, página mantida
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'published', 'archived')),
  position     integer NOT NULL DEFAULT 0,
  created_by   text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- O primeiro curso, que antes vivia no código. Só entra se ainda não existir:
-- edições feitas pelo painel não são sobrescritas.
INSERT INTO courses (slug, pillar, title, edition, tagline, lead, authors, modules,
  materials, software, requirements, photo, status, position, created_by)
VALUES (
  'impressao-3d-basic', 'impressao-3d', 'Impressão 3D: Basic', '2026',
  'Pense, prepare, imprima!',
  'Os fundamentos da manufatura aditiva, da anatomia da impressora ao fatiamento, para transformar uma ideia em peça na mesa.',
  'G. P. Stoppa & M. H. Stoppa',
  '[
    {"title": "Introdução", "description": "História, tecnologias (FDM, SLA, SLS), o projeto RepRap e a anatomia da impressora Ender 3.", "icon": "factory"},
    {"title": "Manutenção", "description": "Preservação, limpeza, lubrificação, troca de filamento e solução de falhas comuns como warping e stringing.", "icon": "bolt"},
    {"title": "Configuração", "description": "Painel de controle, pré-aquecimento, nivelamento da mesa e a distância correta do bico.", "icon": "layers"},
    {"title": "Fatiamento", "description": "OrcaSlicer na prática: parâmetros de qualidade e resistência, suportes e calibração.", "icon": "scissors"}
  ]'::jsonb,
  ARRAY['PLA (foco prático)', 'ABS', 'PETG', 'TPU'],
  ARRAY['OrcaSlicer (foco principal)', 'Cura', 'PrusaSlicer'],
  'Notebook que rode o OrcaSlicer.',
  'turtleSensor', 'published', 0, 'sistema'
)
ON CONFLICT (slug) DO NOTHING;

-- Turma de um curso: data, local, preço, vagas e política de reembolso.
CREATE TABLE IF NOT EXISTS cohorts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id               text NOT NULL,
  label                   text,
  starts_at               timestamptz NOT NULL,
  ends_at                 timestamptz NOT NULL CHECK (ends_at > starts_at),
  venue                   text NOT NULL,
  address                 text NOT NULL,
  price_cents             integer NOT NULL CHECK (price_cents > 0),
  capacity                integer NOT NULL CHECK (capacity BETWEEN 1 AND 500),
  late_refund_percent     integer NOT NULL CHECK (late_refund_percent BETWEEN 0 AND 100),
  late_refund_days_before integer NOT NULL CHECK (late_refund_days_before BETWEEN 0 AND 90),
  -- draft: invisível · open: vendendo · closed: sem vendas · cancelled: cancelada
  status                  text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'open', 'closed', 'cancelled')),
  created_by              text NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cohorts_course_idx ON cohorts (course_id, status, starts_at);

CREATE TABLE IF NOT EXISTS enrollments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id               text NOT NULL,
  cohort_id               uuid NOT NULL REFERENCES cohorts (id),
  buyer_name              text NOT NULL,
  buyer_email             text NOT NULL,
  -- CPF cifrado com AES-256-GCM (DATA_ENCRYPTION_KEY). Nunca em texto puro.
  buyer_cpf_enc           text NOT NULL,
  -- Congelados no momento da compra: o aluno aceitou estas condições.
  amount_cents            integer NOT NULL CHECK (amount_cents > 0),
  late_refund_percent     integer NOT NULL,
  late_refund_days_before integer NOT NULL,

  -- O Checkout Pro trabalha com preferência (antes) e pagamento (depois).
  -- O reembolso é feito sobre o pagamento.
  mp_preference_id        text,
  mp_payment_id           text UNIQUE,
  payment_status          text NOT NULL DEFAULT 'pending'
                          CHECK (payment_status IN ('pending', 'approved', 'refunded', 'cancelled')),
  paid_at                 timestamptz,

  -- Ciência do aluno: o texto exato que ele viu, quando e de onde marcou.
  consent_text            text NOT NULL,
  consent_version         text NOT NULL,
  consent_timestamp       timestamptz NOT NULL,
  consent_ip              text NOT NULL,
  consent_user_agent      text,

  -- Valores aleatórios: o do QR de check-in e o do link do certificado.
  checkin_token           text NOT NULL UNIQUE,
  certificate_token       text NOT NULL UNIQUE,
  attendance_confirmed    boolean NOT NULL DEFAULT false,
  attendance_timestamp    timestamptz,
  attendance_by           text,

  refund_requested_at     timestamptz,
  refund_status           text NOT NULL DEFAULT 'none'
                          CHECK (refund_status IN ('none', 'auto_approved', 'manual_review', 'denied', 'approved')),
  refund_amount_cents     integer,
  refund_decided_at       timestamptz,
  refund_decided_by       text,
  refund_note             text,
  mp_refund_id            text,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enrollments_cohort_idx ON enrollments (cohort_id, payment_status);
CREATE INDEX IF NOT EXISTS enrollments_email_idx ON enrollments (lower(buyer_email));

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollments_touch ON enrollments;
CREATE TRIGGER enrollments_touch BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS cohorts_touch ON cohorts;
CREATE TRIGGER cohorts_touch BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS admins_touch ON admins;
CREATE TRIGGER admins_touch BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS courses_touch ON courses;
CREATE TRIGGER courses_touch BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE INDEX IF NOT EXISTS courses_status_idx ON courses (status, position);

-- Turma e matrícula só existem para um curso cadastrado. Adicionadas à parte
-- porque bancos criados antes da tabela de cursos já têm as duas tabelas.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cohorts_course_fk') THEN
    ALTER TABLE cohorts ADD CONSTRAINT cohorts_course_fk
      FOREIGN KEY (course_id) REFERENCES courses (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_course_fk') THEN
    ALTER TABLE enrollments ADD CONSTRAINT enrollments_course_fk
      FOREIGN KEY (course_id) REFERENCES courses (slug);
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------------

-- Evidência numa contestação de chargeback, então é somente inserção: o
-- trigger recusa UPDATE e DELETE até para o dono da tabela.
CREATE TABLE IF NOT EXISTS audit_log (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- 'sistema', 'webhook', 'aluno', 'admin:<usuário>' ou 'master:<usuário>'.
  actor         text NOT NULL,
  action        text NOT NULL,
  enrollment_id uuid REFERENCES enrollments (id),
  ip            text,
  details       jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS audit_log_enrollment_idx ON audit_log (enrollment_id, created_at);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log (action, created_at DESC);

CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log aceita apenas INSERT';
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_change ON audit_log;
CREATE TRIGGER audit_log_no_change BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
DROP TRIGGER IF EXISTS audit_log_no_truncate ON audit_log;
CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_immutable();
