-- Миграция: добавление новых колонок
-- type_id, model_id, model_count, video_urls

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS type_id BIGINT;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS model_id BIGINT;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS model_count INTEGER;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS video_urls TEXT[];
