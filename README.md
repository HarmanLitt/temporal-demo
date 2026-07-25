# temporal-demo
Technical Assessment

I will be using an example from my personal experience. As an integrations leader at Flyt I worked on Point of Sale integrations between restaurant brands and food delivery companies

The flow is as follows:

1. A user selects items and modifiers from a menu.
2. A user confirms their order
3. Order confirmation is sent to food delivery app
4. Order is sent to POS
5. Order is completed
6. Order completion is sent from POS to food delivery app

## QuickBite

Food delivery UI demo. Browse a McDonald’s menu, pick modifiers, and place an order. HTTP requests are decoupled from Kafka: reads use normal API responses, while order processing uses asynchronous Kafka events.

## Stack

- Vite + React + TypeScript
- Material UI
- Express + KafkaJS
- Apache Kafka in KRaft mode
- SQLite order-status database

## Run locally

```bash
npm install
npm run kafka:up
npm run dev
```

`npm run dev` starts six separate local processes: the React UI and five independently running services.

Open http://localhost:5173. The Order API runs on port 3001, the Order Status API runs on port 3002, Kafka runs on port 9092, and Kafka UI is available at http://localhost:8080.

To run the five services as separate Docker containers instead:

```bash
npm run services:up
npm run dev:web
```

## Scripts

- `npm run dev` — start all five services and the Vite dev server
- `npm run dev:api` — start only the Order API
- `npm run dev:web` — start only the Vite dev server
- `npm run service:payment` — start only the Payment service
- `npm run service:pos` — start only the POS integration service
- `npm run service:restaurant` — start only the Restaurant service
- `npm run service:status` — start only the Order Status service
- `npm run kafka:up` — start the local Kafka broker and Kafka UI
- `npm run services:up` — build and start all five service containers
- `npm run services:stop` — stop all five service containers
- `npm run kafka:down` — stop the local Kafka broker
- `npm run build` — typecheck the frontend and server, then build the frontend
- `npm run preview` — preview the production build

## How it works

1. Menu and modifier endpoints return data directly over HTTP.
2. The Order API accepts `POST /api/orders` and publishes `order.placed`.
3. The API immediately returns `202 Accepted`; it does not wait for a Kafka consumer.
4. The Payment service consumes the order and publishes `payment.authorized`.
5. The POS service consumes that event and publishes `pos.submitted`.
6. The Restaurant service consumes the POS event and publishes acceptance progress.
7. Every stage is also published to `order.status`.
8. The Order Status service consumes statuses into SQLite and serves `GET /api/order-status/:orderId`.
9. The browser polls that endpoint and displays live progress.
10. Payment and POS operations have timeouts and automatic attempts; the demo intentionally retries the first POS attempt.
11. `POST /api/orders/:orderId/cancel` publishes a cancellation request. If payment was authorized, the Payment service refunds it before marking the order cancelled.

## Services

- `services/order-api` — HTTP commands and Kafka event production
- `services/payment-service` — payment authorization and refunds
- `services/pos-service` — POS submission and retry behavior
- `services/restaurant-service` — restaurant acceptance and timeout behavior
- `services/order-status-service` — Kafka read model, SQLite, and status HTTP API

Topics default to three partitions. Order messages use
`restaurantId-orderId` as their Kafka key, keeping all events for a given order
on the same partition.

The topics are:

- `quickbite.order.placed`
- `quickbite.order.status`
- `quickbite.payment.authorized`
- `quickbite.pos.submitted`
- `quickbite.order.cancellation-requested`

Demo retry and timeout behavior can be adjusted with `DEMO_MAX_ATTEMPTS`, `DEMO_ACTIVITY_TIMEOUT_MS`, `DEMO_POS_FAILURES_BEFORE_SUCCESS`, `DEMO_RESTAURANT_ACCEPTANCE_DELAY_MS`, and `DEMO_RESTAURANT_ACCEPTANCE_TIMEOUT_MS`.

Order statuses are persisted in `data/order-status.db`. Docker uses a named volume so the database survives container replacement.

## External Kafka

The bridge defaults to `localhost:9092`. Configure another cluster with environment variables:

```bash
KAFKA_BROKERS=broker.example.com:9092 \
KAFKA_SSL=true \
KAFKA_USERNAME=your-api-key \
KAFKA_PASSWORD=your-api-secret \
npm run dev
```

Topic names, group IDs, partition count, and service ports can also be overridden; see `services/shared/kafka.ts`.
