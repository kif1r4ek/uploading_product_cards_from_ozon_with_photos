import { config } from '../config.js';

const ENDPOINTS = {
  productList: '/v3/product/list',
  productInfoList: '/v3/product/info/list',
  productDescription: '/v1/product/info/description',
  productAttributes: '/v4/product/info/attributes',
  productPictures: '/v2/product/pictures/info'
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(endpoint, body, retryCount = 0) {
  const url = `${config.ozon.apiUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': config.ozon.clientId,
        'Api-Key': config.ozon.apiKey
      },
      body: JSON.stringify(body)
    });

    if (response.status === 429) {
      if (retryCount < config.request.maxRetries) {
        const delay = config.request.retryBackoffMs * Math.pow(2, retryCount);
        console.log(`Rate limited, waiting ${delay}ms...`);
        await sleep(delay);
        return makeRequest(endpoint, body, retryCount + 1);
      }
      throw new Error('Rate limit exceeded after max retries');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    await sleep(config.request.delayMs);
    return response.json();
  } catch (error) {
    if (retryCount < config.request.maxRetries && error.code === 'ECONNRESET') {
      const delay = config.request.retryBackoffMs * Math.pow(2, retryCount);
      console.log(`Network error, retrying in ${delay}ms...`);
      await sleep(delay);
      return makeRequest(endpoint, body, retryCount + 1);
    }
    throw error;
  }
}

async function* fetchAllProducts() {
  let lastId = '';
  let hasMore = true;

  while (hasMore) {
    const body = {
      filter: { visibility: 'ALL' },
      limit: config.request.limit,
      last_id: lastId
    };

    const data = await makeRequest(ENDPOINTS.productList, body);
    const items = data.result?.items || [];

    if (items.length > 0) {
      yield items;
      lastId = data.result?.last_id || '';
      hasMore = items.length === config.request.limit && lastId !== '';
    } else {
      hasMore = false;
    }
  }
}

async function fetchProductsInfo(productIds) {
  if (!productIds.length) return [];

  const body = { product_id: productIds };
  const data = await makeRequest(ENDPOINTS.productInfoList, body);
  return data.items || data.result?.items || [];
}

async function fetchProductDescription(productId) {
  const body = { product_id: productId };
  const data = await makeRequest(ENDPOINTS.productDescription, body);
  return data.result || null;
}

async function fetchProductAttributes(productIds) {
  if (!productIds.length) return [];

  const body = {
    filter: { product_id: productIds, visibility: 'ALL' },
    limit: productIds.length
  };
  const data = await makeRequest(ENDPOINTS.productAttributes, body);
  return data.result || [];
}

async function fetchProductPictures(productIds) {
  if (!productIds.length) return [];

  const body = { product_id: productIds };
  const data = await makeRequest(ENDPOINTS.productPictures, body);
  return data.items || data.result?.pictures || [];
}

export {
  fetchAllProducts,
  fetchProductsInfo,
  fetchProductDescription,
  fetchProductAttributes,
  fetchProductPictures
};
