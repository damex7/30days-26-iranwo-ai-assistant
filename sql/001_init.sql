-- Ìrànwọ́ schema. Run with: npm run db:migrate
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  name          text NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','admin')),
  daily_limit   integer,                       -- NULL = use DAILY_AI_LIMIT
  suspended     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- We store a SHA-256 hash of the session token, never the token itself.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

-- One business per owner. This profile is what makes the AI answer "like your shop".
CREATE TABLE IF NOT EXISTS businesses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  what_we_sell  text NOT NULL,
  city          text NOT NULL,
  state         text NOT NULL,
  tone          text NOT NULL DEFAULT 'friendly' CHECK (tone IN ('friendly','formal','playful','pidgin-friendly')),
  whatsapp      text NOT NULL,
  bank_name     text,
  account_name  text,
  account_no    text,
  policies      text,                          -- delivery, returns, opening hours
  invoice_seq   integer NOT NULL DEFAULT 0,    -- atomic counter for invoice numbers
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'New chat',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS conversations_biz_idx ON conversations(business_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id              bigserial PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('user','assistant')),
  content         text NOT NULL,
  input_tokens    integer NOT NULL DEFAULT 0,
  output_tokens   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages(conversation_id, id);

-- Money is always integer kobo. The AI suggests items; the server does the maths.
CREATE TABLE IF NOT EXISTS invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  number         integer NOT NULL,
  customer_name  text NOT NULL,
  customer_phone text,
  items          jsonb NOT NULL,              -- [{description, quantity, unit_kobo}]
  delivery_kobo  bigint NOT NULL DEFAULT 0 CHECK (delivery_kobo >= 0),
  subtotal_kobo  bigint NOT NULL CHECK (subtotal_kobo >= 0),
  total_kobo     bigint NOT NULL CHECK (total_kobo >= 0),
  notes          text,
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),
  source_text    text,                        -- what the owner typed
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, number)
);

-- Saved outputs from the reply and post writers
CREATE TABLE IF NOT EXISTS drafts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('reply','post')),
  input       text NOT NULL,
  output      jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drafts_biz_idx ON drafts(business_id, kind, created_at DESC);

-- One row per user per Lagos day. The limit check and the increment happen in ONE statement.
CREATE TABLE IF NOT EXISTS usage_days (
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day           date NOT NULL,
  requests      integer NOT NULL DEFAULT 0,
  input_tokens  integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
