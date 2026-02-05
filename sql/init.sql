CREATE TABLE IF NOT EXISTS ozon_product_cards (
    product_id BIGINT PRIMARY KEY,
    offer_id VARCHAR(255),
    sku BIGINT,
    fbo_sku BIGINT,
    fbs_sku BIGINT,
    barcode VARCHAR(255),

    name TEXT,
    description TEXT,
    brand VARCHAR(255),
    category_id BIGINT,
    type_id BIGINT,
    model_id BIGINT,
    model_count INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    visible BOOLEAN,

    price VARCHAR(50),
    old_price VARCHAR(50),
    premium_price VARCHAR(50),
    marketing_price VARCHAR(50),
    min_price VARCHAR(50),
    currency_code VARCHAR(10),
    vat VARCHAR(20),

    volume_weight DECIMAL(12,4),
    is_prepayment BOOLEAN,
    is_prepayment_allowed BOOLEAN,
    is_kgt BOOLEAN,
    is_discounted BOOLEAN,
    is_super BOOLEAN,
    is_seasonal BOOLEAN,

    color_image TEXT,
    primary_image TEXT,
    images TEXT[],
    images_360 TEXT[],
    video_urls TEXT[],
    pdf_list TEXT[],

    attributes JSONB,
    raw_attributes JSONB,

    height INTEGER,
    depth INTEGER,
    width INTEGER,
    weight INTEGER,
    dimension_unit VARCHAR(20),
    weight_unit VARCHAR(20),

    -- Статусы (исправленные названия полей из API)
    status VARCHAR(50),
    status_failed VARCHAR(255),
    moderate_status VARCHAR(50),
    validation_status VARCHAR(50),
    status_name VARCHAR(255),
    status_description TEXT,
    status_tooltip TEXT,
    status_updated_at TIMESTAMPTZ,
    is_created BOOLEAN,

    sources JSONB,

    -- Остатки по складам
    stocks_fbo_present INTEGER,
    stocks_fbo_reserved INTEGER,
    stocks_fbs_present INTEGER,
    stocks_fbs_reserved INTEGER,
    has_stock BOOLEAN,

    -- Комиссии (FBO, FBS, RFBS, FBP)
    commissions JSONB,

    -- Индексы цен
    price_index_color VARCHAR(50),
    price_index_value DECIMAL(10,2),
    price_index_min_price VARCHAR(50),

    -- Доступность и причины скрытия
    availabilities JSONB,

    -- Акции
    promotions JSONB,

    -- Видимость
    has_price BOOLEAN,

    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ozon_cards_offer_id ON ozon_product_cards(offer_id);
CREATE INDEX IF NOT EXISTS idx_ozon_cards_sku ON ozon_product_cards(sku);
CREATE INDEX IF NOT EXISTS idx_ozon_cards_barcode ON ozon_product_cards(barcode);
CREATE INDEX IF NOT EXISTS idx_ozon_cards_status ON ozon_product_cards(status);

CREATE TABLE IF NOT EXISTS ozon_products_cards_sync_log (
    id SERIAL PRIMARY KEY,
    job_start TIMESTAMPTZ NOT NULL,
    job_end TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    products_fetched INTEGER DEFAULT 0,
    products_inserted INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    http_requests INTEGER DEFAULT 0,
    retries INTEGER DEFAULT 0,
    error_message TEXT
);
