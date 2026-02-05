import pg from 'pg';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const pool = new Pool(config.postgres);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function query(text, params) {
  return pool.query(text, params);
}

async function initTables() {
  const sqlPath = path.join(__dirname, '..', 'sql', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
  console.log('Database tables initialized');
  await pool.end();
}

async function upsertProductCard(card) {
  const sql = `
    INSERT INTO ozon_product_cards (
      product_id, offer_id, sku, fbo_sku, fbs_sku, barcode,
      name, description, brand, category_id, type_id, model_id, model_count,
      created_at, updated_at, visible,
      price, old_price, premium_price, marketing_price, min_price, currency_code, vat,
      volume_weight, is_prepayment, is_prepayment_allowed, is_kgt,
      is_discounted, is_super, is_seasonal,
      color_image, primary_image, images, images_360, video_urls, pdf_list,
      attributes, raw_attributes,
      height, depth, width, weight, dimension_unit, weight_unit,
      status, status_failed, moderate_status, validation_status,
      status_name, status_description, status_tooltip, status_updated_at, is_created,
      sources,
      stocks_fbo_present, stocks_fbo_reserved, stocks_fbs_present, stocks_fbs_reserved, has_stock,
      commissions,
      price_index_color, price_index_value, price_index_min_price,
      availabilities, promotions, has_price,
      synced_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
      $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
      $51, $52, $53, $54, $55, $56, $57, $58, $59, $60,
      $61, $62, $63, $64, $65, $66, NOW()
    )
    ON CONFLICT (product_id) DO UPDATE SET
      offer_id = EXCLUDED.offer_id,
      sku = EXCLUDED.sku,
      fbo_sku = EXCLUDED.fbo_sku,
      fbs_sku = EXCLUDED.fbs_sku,
      barcode = EXCLUDED.barcode,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      brand = EXCLUDED.brand,
      category_id = EXCLUDED.category_id,
      type_id = EXCLUDED.type_id,
      model_id = EXCLUDED.model_id,
      model_count = EXCLUDED.model_count,
      updated_at = EXCLUDED.updated_at,
      visible = EXCLUDED.visible,
      price = EXCLUDED.price,
      old_price = EXCLUDED.old_price,
      premium_price = EXCLUDED.premium_price,
      marketing_price = EXCLUDED.marketing_price,
      min_price = EXCLUDED.min_price,
      currency_code = EXCLUDED.currency_code,
      vat = EXCLUDED.vat,
      volume_weight = EXCLUDED.volume_weight,
      is_prepayment = EXCLUDED.is_prepayment,
      is_prepayment_allowed = EXCLUDED.is_prepayment_allowed,
      is_kgt = EXCLUDED.is_kgt,
      is_discounted = EXCLUDED.is_discounted,
      is_super = EXCLUDED.is_super,
      is_seasonal = EXCLUDED.is_seasonal,
      color_image = EXCLUDED.color_image,
      primary_image = EXCLUDED.primary_image,
      images = EXCLUDED.images,
      images_360 = EXCLUDED.images_360,
      video_urls = EXCLUDED.video_urls,
      pdf_list = EXCLUDED.pdf_list,
      attributes = EXCLUDED.attributes,
      raw_attributes = EXCLUDED.raw_attributes,
      height = EXCLUDED.height,
      depth = EXCLUDED.depth,
      width = EXCLUDED.width,
      weight = EXCLUDED.weight,
      dimension_unit = EXCLUDED.dimension_unit,
      weight_unit = EXCLUDED.weight_unit,
      status = EXCLUDED.status,
      status_failed = EXCLUDED.status_failed,
      moderate_status = EXCLUDED.moderate_status,
      validation_status = EXCLUDED.validation_status,
      status_name = EXCLUDED.status_name,
      status_description = EXCLUDED.status_description,
      status_tooltip = EXCLUDED.status_tooltip,
      status_updated_at = EXCLUDED.status_updated_at,
      is_created = EXCLUDED.is_created,
      sources = EXCLUDED.sources,
      stocks_fbo_present = EXCLUDED.stocks_fbo_present,
      stocks_fbo_reserved = EXCLUDED.stocks_fbo_reserved,
      stocks_fbs_present = EXCLUDED.stocks_fbs_present,
      stocks_fbs_reserved = EXCLUDED.stocks_fbs_reserved,
      has_stock = EXCLUDED.has_stock,
      commissions = EXCLUDED.commissions,
      price_index_color = EXCLUDED.price_index_color,
      price_index_value = EXCLUDED.price_index_value,
      price_index_min_price = EXCLUDED.price_index_min_price,
      availabilities = EXCLUDED.availabilities,
      promotions = EXCLUDED.promotions,
      has_price = EXCLUDED.has_price,
      synced_at = NOW()
    RETURNING (xmax = 0) AS inserted`;

  const values = [
    card.product_id,
    card.offer_id,
    card.sku,
    card.fbo_sku,
    card.fbs_sku,
    card.barcode,
    card.name,
    card.description,
    card.brand,
    card.category_id,
    card.type_id,
    card.model_id,
    card.model_count,
    card.created_at,
    card.updated_at,
    card.visible,
    card.price,
    card.old_price,
    card.premium_price,
    card.marketing_price,
    card.min_price,
    card.currency_code,
    card.vat,
    card.volume_weight,
    card.is_prepayment,
    card.is_prepayment_allowed,
    card.is_kgt,
    card.is_discounted,
    card.is_super,
    card.is_seasonal,
    card.color_image,
    card.primary_image,
    card.images,
    card.images_360,
    card.video_urls,
    card.pdf_list,
    card.attributes,
    card.raw_attributes,
    card.height,
    card.depth,
    card.width,
    card.weight,
    card.dimension_unit,
    card.weight_unit,
    card.status,
    card.status_failed,
    card.moderate_status,
    card.validation_status,
    card.status_name,
    card.status_description,
    card.status_tooltip,
    card.status_updated_at,
    card.is_created,
    card.sources,
    card.stocks_fbo_present,
    card.stocks_fbo_reserved,
    card.stocks_fbs_present,
    card.stocks_fbs_reserved,
    card.has_stock,
    card.commissions,
    card.price_index_color,
    card.price_index_value,
    card.price_index_min_price,
    card.availabilities,
    card.promotions,
    card.has_price
  ];

  const result = await query(sql, values);
  return result.rows[0]?.inserted ?? false;
}

async function close() {
  await pool.end();
}

export default { query, initTables, upsertProductCard, close };

// Run initTables if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initTables().catch(console.error);
}
