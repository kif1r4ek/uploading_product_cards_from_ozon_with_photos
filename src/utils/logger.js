import db from '../database.js';

class SyncLogger {
  constructor() {
    this.logId = null;
    this.stats = {
      productsFetched: 0,
      productsInserted: 0,
      productsUpdated: 0,
      httpRequests: 0,
      retries: 0
    };
  }

  async start() {
    const result = await db.query(
      `INSERT INTO ozon_products_cards_sync_log (job_start, status) VALUES (NOW(), 'running') RETURNING id`
    );
    this.logId = result.rows[0].id;
    return this.logId;
  }

  incrementHttpRequests() {
    this.stats.httpRequests++;
  }

  incrementRetries() {
    this.stats.retries++;
  }

  addFetched(count) {
    this.stats.productsFetched += count;
  }

  addInserted() {
    this.stats.productsInserted++;
  }

  addUpdated() {
    this.stats.productsUpdated++;
  }

  async success() {
    await db.query(
      `UPDATE ozon_products_cards_sync_log SET
        job_end = NOW(),
        status = 'success',
        products_fetched = $1,
        products_inserted = $2,
        products_updated = $3,
        http_requests = $4,
        retries = $5
      WHERE id = $6`,
      [
        this.stats.productsFetched,
        this.stats.productsInserted,
        this.stats.productsUpdated,
        this.stats.httpRequests,
        this.stats.retries,
        this.logId
      ]
    );
  }

  async fail(errorMessage) {
    await db.query(
      `UPDATE ozon_products_cards_sync_log SET
        job_end = NOW(),
        status = 'failed',
        products_fetched = $1,
        products_inserted = $2,
        products_updated = $3,
        http_requests = $4,
        retries = $5,
        error_message = $6
      WHERE id = $7`,
      [
        this.stats.productsFetched,
        this.stats.productsInserted,
        this.stats.productsUpdated,
        this.stats.httpRequests,
        this.stats.retries,
        errorMessage,
        this.logId
      ]
    );
  }

  getStats() {
    return this.stats;
  }
}

export default SyncLogger;
