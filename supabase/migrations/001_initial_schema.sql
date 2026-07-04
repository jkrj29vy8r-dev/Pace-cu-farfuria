-- Purchases: one row per confirmed Stripe payment
CREATE TABLE IF NOT EXISTS public.purchases (
  id                       UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email                    TEXT        NOT NULL,
  stripe_session_id        TEXT        UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_total             INTEGER,                      -- in bani (RON × 100)
  currency                 TEXT        DEFAULT 'ron',
  status                   TEXT        DEFAULT 'completed'
                                       CHECK (status IN ('pending','completed','refunded')),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Download tokens: time-limited, count-limited links for PDF delivery
CREATE TABLE IF NOT EXISTS public.download_tokens (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id    UUID        NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  token          TEXT        UNIQUE NOT NULL,
  download_count INTEGER     DEFAULT 0,
  max_downloads  INTEGER     DEFAULT 5,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchases_email          ON public.purchases(email);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON public.purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_dl_tokens_token         ON public.download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_dl_tokens_purchase      ON public.download_tokens(purchase_id);

-- Auto-update updated_at on purchases
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: no public policies = only service_role (API routes) can read/write
ALTER TABLE public.purchases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;
