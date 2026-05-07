-- Tabel pentru produse cadouri clienti
CREATE TABLE IF NOT EXISTS gift_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pnk TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  price TEXT,
  image_url TEXT,
  emag_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gift_products ENABLE ROW LEVEL SECURITY;

-- Policy: service role can do everything
CREATE POLICY "service_role_all" ON gift_products
  FOR ALL USING (true) WITH CHECK (true);

-- Index pe PNK
CREATE INDEX IF NOT EXISTS gift_products_pnk_idx ON gift_products(pnk);
