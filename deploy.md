# Инструкция по развертыванию uploading_product_cards_from_ozon_with_photos

Пошаговая инструкция для развертывания скрипта выгрузки **карточек товаров Ozon** на сервере Ubuntu 24.04 с FASTPANEL.

## Описание

Скрипт:
- Использует **Ozon Seller API** (5 эндпоинтов)
- Выгружает все карточки товаров продавца
- Сохраняет все данные в одну таблицу `ozon_product_cards`
- Использует UPSERT для защиты от дубликатов
- Ведёт технические логи выполнения в БД
- Запускается каждые 30 минут через cron

---

## API Ozon Seller

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/v3/product/list` | Список товаров (пагинация) |
| POST | `/v3/product/info/list` | Информация о товарах |
| POST | `/v1/product/info/description` | Описание товара |
| POST | `/v4/product/info/attributes` | Атрибуты товара |
| POST | `/v2/product/pictures/info` | Картинки товара |

### Базовый URL

```
https://api-seller.ozon.ru
```

### Заголовки авторизации

| Заголовок | Описание |
|-----------|----------|
| `Client-Id` | ID клиента |
| `Api-Key` | API ключ |
| `Content-Type` | `application/json` |

---

## Требования

- Ubuntu 24.04
- Node.js 18.x или выше
- PostgreSQL (доступ к БД)
- Ozon Client-Id и Api-Key

---

## Шаг 1: Подключение к серверу

```bash
ssh root@109.73.194.111
# Пароль: w8hDWrMybh6-bH
```

---

## Шаг 2: Проверка Node.js

```bash
node --version
npm --version
```

Если Node.js не установлен:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs
```

---

## Шаг 3: Копирование проекта на сервер

### Вариант A: Через SCP (папка)
```bash
scp -r uploading_product_cards_from_ozon_with_photos root@109.73.194.111:/opt/
# Пароль: w8hDWrMybh6-bH
```

### Вариант B: Через SCP (архив)
```bash
scp uploading_product_cards_from_ozon_with_photos.zip root@109.73.194.111:/opt/
ssh root@109.73.194.111
cd /opt
unzip uploading_product_cards_from_ozon_with_photos.zip
```

---

## Шаг 4: Установка зависимостей

```bash
cd /opt/uploading_product_cards_from_ozon_with_photos
npm install
```

---

## Шаг 5: Настройка конфигурации (.env)

```bash
nano .env
```

Заполните `.env`:

```env
OZON_CLIENT_ID=2843272
OZON_API_KEY=76fb74b8-0018-48f6-aa5b-ba7e04cff1a2
OZON_API_URL=https://api-seller.ozon.ru

PG_HOST=176.124.219.60
PG_PORT=5432
PG_USER=gen_user
PG_PASSWORD=y>D4~;f^YLgFA|
PG_DATABASE=default_db

REQUEST_LIMIT=1000
REQUEST_DELAY_MS=300
MAX_RETRIES=5
RETRY_BACKOFF_MS=2000
```

Сохраните: `Ctrl+X`, затем `Y`, затем `Enter`.

### Параметры конфигурации

| Параметр | Описание | По умолчанию |
|----------|----------|--------------|
| `OZON_CLIENT_ID` | Client-Id из личного кабинета Ozon | - |
| `OZON_API_KEY` | Api-Key из личного кабинета Ozon | - |
| `REQUEST_LIMIT` | Записей на страницу (макс. 1000) | `1000` |
| `REQUEST_DELAY_MS` | Задержка между запросами | `300` |
| `MAX_RETRIES` | Макс. повторов при ошибке | `5` |
| `RETRY_BACKOFF_MS` | Базовая задержка для backoff | `2000` |

---

## Шаг 6: Создание таблиц в БД

### Способ 1: Через npm скрипт
```bash
cd /opt/uploading_product_cards_from_ozon_with_photos
npm run init-db
```

### Способ 2: Через psql
```bash
apt update && apt install -y postgresql-client
psql -h 176.124.219.60 -U gen_user -d default_db -f /opt/uploading_product_cards_from_ozon_with_photos/sql/init.sql
# Введите пароль: y>D4~;f^YLgFA|
```

### Структура таблиц

| Таблица | Назначение |
|---------|------------|
| `ozon_product_cards` | Карточки товаров (все данные + фото) |
| `ozon_products_cards_sync_log` | Логи выполнения синхронизации |

---

## Шаг 7: Тестовый запуск

```bash
cd /opt/uploading_product_cards_from_ozon_with_photos
node src/app.js
```

### Ожидаемый вывод:

```
============================================================
Ozon Product Cards Sync started at 2025-02-05T12:00:00.000Z
============================================================
Fetched 150 product IDs...
Total products to process: 150
Processed 100/150 products
Processed 150/150 products
============================================================
Summary:
  Products fetched: 150
  New products: 120
  Updated products: 30
  HTTP requests: 156
  Retries: 0
  Duration: 45 seconds
============================================================
```

---

## Шаг 8: Настройка Cron (каждые 30 минут)

```bash
crontab -e
```

Добавьте строку:
```cron
*/30 * * * * cd /opt/uploading_product_cards_from_ozon_with_photos && /usr/bin/node src/app.js >> /var/log/ozon_product_cards_sync.log 2>&1
```

### Проверка cron:
```bash
crontab -l
```

### Создание файла лога:
```bash
touch /var/log/ozon_product_cards_sync.log
chmod 644 /var/log/ozon_product_cards_sync.log
```

---

## Шаг 9: Проверка работы

### Просмотр логов в реальном времени:
```bash
tail -f /var/log/ozon_product_cards_sync.log
```

### Проверка данных в БД:
```bash
psql -h 176.124.219.60 -U gen_user -d default_db
# Введите пароль: y>D4~;f^YLgFA|
```

```sql
-- Количество карточек
SELECT COUNT(*) FROM ozon_product_cards;

-- Последние добавленные карточки
SELECT
    product_id, offer_id, name, brand,
    synced_at
FROM ozon_product_cards
ORDER BY synced_at DESC
LIMIT 10;

-- Карточки с фотографиями
SELECT
    product_id, offer_id, name,
    array_length(images, 1) as images_count,
    primary_image
FROM ozon_product_cards
WHERE images IS NOT NULL
LIMIT 10;

-- Все изображения товара
SELECT
    product_id, offer_id,
    primary_image,
    images,
    images_360
FROM ozon_product_cards
WHERE product_id = 123456789;

-- Развернуть все изображения товара в строки
SELECT
    product_id, offer_id,
    unnest(images) as image_url
FROM ozon_product_cards
WHERE product_id = 123456789;

-- Логи синхронизации
SELECT
    job_start, job_end, status,
    products_fetched, products_inserted, products_updated,
    http_requests, retries,
    EXTRACT(EPOCH FROM (job_end - job_start))::int AS duration_sec
FROM ozon_products_cards_sync_log
ORDER BY job_start DESC
LIMIT 10;

-- Ошибки синхронизации
SELECT job_start, status, error_message
FROM ozon_products_cards_sync_log
WHERE status = 'failed'
ORDER BY job_start DESC
LIMIT 5;
```

---

## Структура проекта

```
uploading_product_cards_from_ozon_with_photos/
├── src/
│   ├── app.js              # Точка входа
│   ├── config.js           # Конфигурация из .env
│   ├── database.js         # Подключение к PostgreSQL
│   ├── api/
│   │   └── ozonApi.js      # Ozon Seller API
│   ├── services/
│   │   └── syncCards.js    # Логика синхронизации
│   └── utils/
│       └── logger.js       # Логирование в БД
├── sql/
│   └── init.sql            # SQL для создания таблиц
├── .env                    # Конфигурация 
├── .gitignore
├── package.json
└── deploy.md               # Эта инструкция
```

---

## Устранение неполадок

### Ошибка подключения к БД

1. Проверьте доступность PostgreSQL:
   ```bash
   nc -zv 176.124.219.60 5432
   ```

2. Проверьте данные в `.env`

3. Тест подключения:
   ```bash
   psql -h 176.124.219.60 -U gen_user -d default_db -c "SELECT 1;"
   ```

### Ошибка API (401 Unauthorized)

1. Проверьте `OZON_CLIENT_ID` и `OZON_API_KEY` в `.env`
2. Убедитесь, что ключи активны в личном кабинете Ozon

### Ошибка API (429 Too Many Requests)

Скрипт автоматически обрабатывает rate limiting с экспоненциальным backoff.
Если ошибка повторяется:
1. Увеличьте `REQUEST_DELAY_MS` в `.env` до 500
2. Уменьшите `REQUEST_LIMIT` до 500

### Cron не работает

1. Проверьте статус cron:
   ```bash
   systemctl status cron
   ```

2. Проверьте логи:
   ```bash
   grep CRON /var/log/syslog
   ```

3. Перезапустите cron:
   ```bash
   systemctl restart cron
   ```

---

## Полезные команды

```bash
# Ручной запуск
cd /opt/uploading_product_cards_from_ozon_with_photos && node src/app.js

# Просмотр последних логов
tail -100 /var/log/ozon_product_cards_sync.log

# Статистика синхронизаций
psql -h 176.124.219.60 -U gen_user -d default_db -c \
  "SELECT status, COUNT(*),
          AVG(EXTRACT(EPOCH FROM (job_end - job_start)))::int as avg_sec,
          SUM(products_fetched) as total_products
   FROM ozon_products_cards_sync_log GROUP BY status;"

# Очистка старых логов (старше 30 дней)
psql -h 176.124.219.60 -U gen_user -d default_db -c \
  "DELETE FROM ozon_products_cards_sync_log WHERE job_start < NOW() - INTERVAL '30 days';"

# Количество записей
psql -h 176.124.219.60 -U gen_user -d default_db -c \
  "SELECT 'ozon_product_cards' as table_name, COUNT(*) FROM ozon_product_cards
   UNION ALL SELECT 'ozon_products_cards_sync_log', COUNT(*) FROM ozon_products_cards_sync_log;"
```

---

## Колонки таблицы ozon_product_cards

| Колонка | Тип | Описание |
|---------|-----|----------|
| `product_id` | BIGINT | ID товара (PK) |
| `offer_id` | VARCHAR | Артикул продавца |
| `sku` | BIGINT | SKU товара |
| `fbo_sku` | BIGINT | SKU FBO |
| `fbs_sku` | BIGINT | SKU FBS |
| `barcode` | VARCHAR | Штрихкод |
| `name` | TEXT | Название товара |
| `description` | TEXT | Описание товара |
| `brand` | VARCHAR | Бренд |
| `category_id` | BIGINT | ID категории |
| `created_at` | TIMESTAMPTZ | Дата создания |
| `visible` | BOOLEAN | Видимость |
| `price` | VARCHAR | Цена |
| `old_price` | VARCHAR | Старая цена |
| `premium_price` | VARCHAR | Premium цена |
| `marketing_price` | VARCHAR | Маркетинговая цена |
| `min_price` | VARCHAR | Минимальная цена |
| `currency_code` | VARCHAR | Код валюты |
| `vat` | VARCHAR | НДС |
| `volume_weight` | DECIMAL | Объёмный вес |
| `color_image` | TEXT | URL цветного изображения |
| `primary_image` | TEXT | URL главного изображения |
| `images` | TEXT[] | Массив URL изображений |
| `images_360` | TEXT[] | Массив URL 360° изображений |
| `pdf_list` | TEXT[] | Массив PDF документов |
| `attributes` | JSONB | Атрибуты (упрощённые) |
| `raw_attributes` | JSONB | Атрибуты (полные) |
| `height` | INTEGER | Высота |
| `depth` | INTEGER | Глубина |
| `width` | INTEGER | Ширина |
| `weight` | INTEGER | Вес |
| `status_state` | VARCHAR | Статус товара |
| `stocks_coming` | INTEGER | Ожидаемые остатки |
| `stocks_present` | INTEGER | Текущие остатки |
| `stocks_reserved` | INTEGER | Зарезервированные остатки |
| `synced_at` | TIMESTAMPTZ | Время синхронизации |
