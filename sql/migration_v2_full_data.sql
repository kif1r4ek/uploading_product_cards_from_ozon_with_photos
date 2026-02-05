-- Миграция v2: Полная структура данных из Ozon API
-- Перед выполнением сделайте бэкап таблицы!

-- Добавляем новые колонки
ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS is_discounted BOOLEAN;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS is_super BOOLEAN;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS is_seasonal BOOLEAN;

-- Переименовываем колонки статусов (старые -> новые)
-- Сначала добавляем новые
ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS status VARCHAR(50);

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS status_failed VARCHAR(255);

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS moderate_status VARCHAR(50);

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(50);

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS status_name VARCHAR(255);

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS status_description TEXT;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS status_tooltip TEXT;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS is_created BOOLEAN;

-- Меняем sources с TEXT[] на JSONB для хранения полной информации
-- Сначала удаляем старую колонку (данные будут перезаписаны при синхронизации)
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS sources;
ALTER TABLE ozon_product_cards ADD COLUMN sources JSONB;

-- Добавляем раздельные остатки по FBO и FBS
ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS stocks_fbo_present INTEGER;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS stocks_fbo_reserved INTEGER;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS stocks_fbs_present INTEGER;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS stocks_fbs_reserved INTEGER;

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS has_stock BOOLEAN;

-- Добавляем комиссии
ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS commissions JSONB;

-- Добавляем индексы цен
ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS price_index_color VARCHAR(50);

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS price_index_value DECIMAL(10,2);

ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS price_index_min_price VARCHAR(50);

-- Добавляем доступность
ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS availabilities JSONB;

-- Добавляем акции
ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS promotions JSONB;

-- Добавляем видимость
ALTER TABLE ozon_product_cards
ADD COLUMN IF NOT EXISTS has_price BOOLEAN;

-- Переносим данные из старых колонок статусов в новые (если есть данные)
UPDATE ozon_product_cards SET
    status = status_state,
    status_failed = status_state_failed,
    moderate_status = status_moderate_status,
    status_name = status_state_name,
    status_description = status_state_description,
    status_tooltip = status_state_tooltip,
    validation_status = status_validation_state,
    status_updated_at = status_state_updated_at
WHERE status IS NULL AND status_state IS NOT NULL;

-- Удаляем старые колонки статусов
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS status_state;
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS status_state_failed;
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS status_moderate_status;
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS status_state_name;
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS status_state_description;
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS status_state_tooltip;
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS status_validation_state;
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS status_state_updated_at;
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS status_is_failed;

-- Удаляем старые колонки остатков
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS stocks_coming;
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS stocks_present;
ALTER TABLE ozon_product_cards DROP COLUMN IF EXISTS stocks_reserved;

-- Создаём индексы
CREATE INDEX IF NOT EXISTS idx_ozon_cards_offer_id ON ozon_product_cards(offer_id);
CREATE INDEX IF NOT EXISTS idx_ozon_cards_sku ON ozon_product_cards(sku);
CREATE INDEX IF NOT EXISTS idx_ozon_cards_barcode ON ozon_product_cards(barcode);
CREATE INDEX IF NOT EXISTS idx_ozon_cards_status ON ozon_product_cards(status);
