import * as ozonApi from '../api/ozonApi.js';
import db from '../database.js';
import SyncLogger from '../utils/logger.js';

const BATCH_SIZE = 100;

function extractAttributes(attributes) {
  if (!attributes?.length) return { attributes: null, rawAttributes: null };

  const simplified = attributes.map(attr => ({
    id: attr.id,
    complex_id: attr.complex_id,
    values: attr.values?.map(v => ({
      dictionary_value_id: v.dictionary_value_id,
      value: v.value
    })) || []
  }));

  return {
    attributes: JSON.stringify(simplified),
    rawAttributes: JSON.stringify(attributes)
  };
}

function extractImages(pictureData, attrItem) {
  // Приоритет: images из attributes response, затем из pictures endpoint
  if (attrItem?.images?.length) {
    return {
      images: attrItem.images,
      images360: attrItem.images360 || null
    };
  }

  if (!pictureData) return { images: null, images360: null };

  // API pictures возвращает: primary_photo[], photo[], photo_360[]
  const allPhotos = [
    ...(pictureData.primary_photo || []),
    ...(pictureData.photo || [])
  ];
  const images360 = pictureData.photo_360 || [];

  return {
    images: allPhotos.length ? allPhotos : null,
    images360: images360.length ? images360 : null
  };
}

function extractVideoUrls(complexAttributes) {
  if (!complexAttributes?.length) return null;

  const videoUrls = [];
  for (const attr of complexAttributes) {
    for (const val of (attr.values || [])) {
      const value = val.value || '';
      if (value.includes('.mp4') || value.includes('cdnvideo')) {
        videoUrls.push(value);
      }
    }
  }

  return videoUrls.length ? videoUrls : null;
}

function extractStocks(info) {
  const stocksArray = info.stocks?.stocks || [];

  const fboStock = stocksArray.find(s => s.source === 'fbo');
  const fbsStock = stocksArray.find(s => s.source === 'fbs');

  return {
    stocks_fbo_present: fboStock?.present ?? null,
    stocks_fbo_reserved: fboStock?.reserved ?? null,
    stocks_fbs_present: fbsStock?.present ?? null,
    stocks_fbs_reserved: fbsStock?.reserved ?? null,
    has_stock: info.stocks?.has_stock ?? null,
    fbo_sku: fboStock?.sku ?? null,
    fbs_sku: fbsStock?.sku ?? null
  };
}

function extractPriceIndexes(priceIndexes) {
  if (!priceIndexes) return { color: null, value: null, minPrice: null };

  return {
    color: priceIndexes.color_index || null,
    value: priceIndexes.external_index_data?.price_index_value ??
           priceIndexes.self_marketplaces_index_data?.price_index_value ?? null,
    minPrice: priceIndexes.external_index_data?.minimal_price ||
              priceIndexes.self_marketplaces_index_data?.minimal_price || null
  };
}

function buildProductCard(info, description, attrItem, pictures) {
  // attrItem - полный объект из /v4/product/info/attributes
  const attributes = attrItem?.attributes || [];
  const { attributes: attrs, rawAttributes } = extractAttributes(attributes);
  const { images, images360 } = extractImages(pictures, attrItem);
  const videoUrls = extractVideoUrls(attrItem?.complex_attributes);
  const stocks = extractStocks(info);
  const priceIndexes = extractPriceIndexes(info.price_indexes);

  // sources - полный массив объектов
  const sources = info.sources?.length ? info.sources : null;

  // SKU из sources или из info.sku
  const mainSku = info.sku || info.sources?.[0]?.sku || null;

  // barcodes - массив, берём первый или из attrItem
  const barcode = attrItem?.barcode ||
                  (Array.isArray(info.barcodes) ? info.barcodes[0] : null) ||
                  (Array.isArray(attrItem?.barcodes) ? attrItem.barcodes[0] : null);

  // primary_image - из attrItem, info или pictures
  const primaryImage = attrItem?.primary_image ||
                       (Array.isArray(info.primary_image) ? info.primary_image[0] : info.primary_image) ||
                       pictures?.primary_photo?.[0] ||
                       info.images?.[0] || null;

  // statuses - объект со статусами (правильные названия полей из API)
  const statuses = info.statuses || {};

  // Размеры берём из attrItem (более полные данные), fallback на info
  const height = attrItem?.height ?? info.height ?? null;
  const depth = attrItem?.depth ?? info.depth ?? null;
  const width = attrItem?.width ?? info.width ?? null;
  const weight = attrItem?.weight ?? info.weight ?? null;
  const dimensionUnit = attrItem?.dimension_unit || info.dimension_unit || null;
  const weightUnit = attrItem?.weight_unit || info.weight_unit || null;

  return {
    product_id: info.id,
    offer_id: info.offer_id || null,
    sku: mainSku,
    fbo_sku: stocks.fbo_sku,
    fbs_sku: stocks.fbs_sku,
    barcode: barcode,

    name: info.name || attrItem?.name || null,
    description: description?.description || null,
    brand: info.brand || null,
    category_id: info.description_category_id || info.category_id || attrItem?.description_category_id || null,
    type_id: attrItem?.type_id || info.type_id || null,
    model_id: attrItem?.model_info?.model_id || info.model_info?.model_id || null,
    model_count: attrItem?.model_info?.count || info.model_info?.count || null,
    created_at: info.created_at || null,
    updated_at: info.updated_at || null,
    visible: !info.is_archived && !info.is_autoarchived,

    price: info.price || null,
    old_price: info.old_price || null,
    premium_price: info.premium_price || null,
    marketing_price: info.marketing_price || null,
    min_price: info.min_price || null,
    currency_code: info.currency_code || null,
    vat: info.vat || null,

    volume_weight: info.volume_weight ?? null,
    is_prepayment: info.is_prepayment ?? null,
    is_prepayment_allowed: info.is_prepayment_allowed ?? null,
    is_kgt: info.is_kgt ?? null,
    is_discounted: info.is_discounted ?? null,
    is_super: info.is_super ?? null,
    is_seasonal: info.is_seasonal ?? null,

    color_image: Array.isArray(info.color_image) ? info.color_image[0] : (info.color_image || attrItem?.color_image || null),
    primary_image: primaryImage,
    images: images,
    images_360: images360 || info.images360 || null,
    video_urls: videoUrls,
    pdf_list: attrItem?.pdf_list?.length ? attrItem.pdf_list : (info.pdf_list?.length ? info.pdf_list : null),

    attributes: attrs,
    raw_attributes: rawAttributes,

    height: height,
    depth: depth,
    width: width,
    weight: weight,
    dimension_unit: dimensionUnit,
    weight_unit: weightUnit,

    // Статусы (правильные названия из API: status, status_failed, moderate_status, etc.)
    status: statuses.status || null,
    status_failed: statuses.status_failed || null,
    moderate_status: statuses.moderate_status || null,
    validation_status: statuses.validation_status || null,
    status_name: statuses.status_name || null,
    status_description: statuses.status_description || null,
    status_tooltip: statuses.status_tooltip || null,
    status_updated_at: statuses.status_updated_at || null,
    is_created: statuses.is_created ?? null,

    sources: sources ? JSON.stringify(sources) : null,

    stocks_fbo_present: stocks.stocks_fbo_present,
    stocks_fbo_reserved: stocks.stocks_fbo_reserved,
    stocks_fbs_present: stocks.stocks_fbs_present,
    stocks_fbs_reserved: stocks.stocks_fbs_reserved,
    has_stock: stocks.has_stock,

    commissions: info.commissions?.length ? JSON.stringify(info.commissions) : null,

    price_index_color: priceIndexes.color,
    price_index_value: priceIndexes.value,
    price_index_min_price: priceIndexes.minPrice,

    availabilities: info.availabilities?.length ? JSON.stringify(info.availabilities) : null,
    promotions: info.promotions?.length ? JSON.stringify(info.promotions) : null,

    has_price: info.visibility_details?.has_price ?? null
  };
}

async function processBatch(productIds, logger) {
  const [infos, allAttributes, allPictures] = await Promise.all([
    ozonApi.fetchProductsInfo(productIds),
    ozonApi.fetchProductAttributes(productIds),
    ozonApi.fetchProductPictures(productIds)
  ]);
  logger.incrementHttpRequests();
  logger.incrementHttpRequests();
  logger.incrementHttpRequests();

  const attributesMap = new Map();
  allAttributes.forEach(item => {
    // Сохраняем весь объект для доступа к type_id, model_info, images, complex_attributes
    attributesMap.set(item.id, item);
  });

  const picturesMap = new Map();
  allPictures.forEach(item => {
    // item содержит: product_id, primary_photo[], photo[], photo_360[]
    picturesMap.set(item.product_id, item);
  });

  for (const info of infos) {
    const description = await ozonApi.fetchProductDescription(info.id);
    logger.incrementHttpRequests();

    const attrItem = attributesMap.get(info.id) || null;
    const pictures = picturesMap.get(info.id) || null;

    const card = buildProductCard(info, description, attrItem, pictures);
    const isNew = await db.upsertProductCard(card);

    if (isNew) {
      logger.addInserted();
    } else {
      logger.addUpdated();
    }
  }

  return infos.length;
}

async function syncCards() {
  const logger = new SyncLogger();
  await logger.start();

  try {
    const productGenerator = ozonApi.fetchAllProducts();
    let allProductIds = [];

    for await (const items of productGenerator) {
      logger.incrementHttpRequests();
      const ids = items.map(item => item.product_id);
      allProductIds = allProductIds.concat(ids);
      console.log(`Fetched ${allProductIds.length} product IDs...`);
    }

    logger.addFetched(allProductIds.length);
    console.log(`Total products to process: ${allProductIds.length}`);

    for (let i = 0; i < allProductIds.length; i += BATCH_SIZE) {
      const batch = allProductIds.slice(i, i + BATCH_SIZE);
      await processBatch(batch, logger);
      console.log(`Processed ${Math.min(i + BATCH_SIZE, allProductIds.length)}/${allProductIds.length} products`);
    }

    await logger.success();
    return logger.getStats();
  } catch (error) {
    await logger.fail(error.message);
    throw error;
  }
}

export { syncCards };
