CREATE TABLE IF NOT EXISTS public.orders (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email         TEXT        NOT NULL,
  stripe_payment_id  TEXT        UNIQUE NOT NULL,
  download_url       TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.download_tokens (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id       UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token          TEXT        UNIQUE NOT NULL,
  download_count INTEGER     DEFAULT 0,
  max_downloads  INTEGER     DEFAULT 5,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_email   ON public.orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON public.orders(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_dl_token       ON public.download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_dl_order       ON public.download_tokens(order_id);
ALTER TABLE public.orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;
