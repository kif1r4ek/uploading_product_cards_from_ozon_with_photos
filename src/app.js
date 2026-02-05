import { syncCards } from './services/syncCards.js';
import db from './database.js';

async function main() {
  const startTime = new Date();
  console.log('============================================================');
  console.log(`Ozon Product Cards Sync started at ${startTime.toISOString()}`);
  console.log('============================================================');

  try {
    const stats = await syncCards();

    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('============================================================');
    console.log('Summary:');
    console.log(`  Products fetched: ${stats.productsFetched}`);
    console.log(`  New products: ${stats.productsInserted}`);
    console.log(`  Updated products: ${stats.productsUpdated}`);
    console.log(`  HTTP requests: ${stats.httpRequests}`);
    console.log(`  Retries: ${stats.retries}`);
    console.log(`  Duration: ${duration} seconds`);
    console.log('============================================================');
  } catch (error) {
    console.error('Sync failed:', error.message);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

main();
