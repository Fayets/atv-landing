-- Ejecutar en Neon si las columnas del quiz no existen aún
ALTER TABLE leads ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bottleneck_areas TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bottleneck_marketing TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bottleneck_ventas TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bottleneck_producto TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bottleneck_sistemas TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS revenue TEXT;
