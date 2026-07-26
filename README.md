# temporal-demo
Technical Assessment

I will be using an example from my personal experience. As an integrations leader at Flyt I worked on Point of Sale integrations between restaurant brands and food delivery companies

The flow is as follows:

1. A user selects items and modifiers from a menu.
2. A user confirms their order
3. Order confirmation is sent to food delivery app
4. Order is sent to POS
5. Order waits on resturant acceptance

## Stack

- Vite + React + TypeScript
- Material UI
- Express
- Temporal (workflows and activities)

## Run locally

```bash
npm install
npm run temporal:up
npm run dev
```

`npm run dev` starts four local processes: Order API, Temporal worker, Order Status service, and the React UI.

Open http://localhost:5173. The Order API runs on port 3001, the Order Status API on port 3002, Temporal on port 7233, and Temporal UI at http://localhost:8233.

To run the app services as Docker containers instead:

```bash
npm run temporal:up
npm run services:up
npm run dev:web
```

## Scripts

- `npm run dev` — start API, worker, status service, and Vite
- `npm run dev:api` — start only the Order API
- `npm run dev:web` — start only the Vite dev server
- `npm run service:worker` — start only the Temporal worker
- `npm run service:status` — start only the Order Status service
- `npm run temporal:up` — start Temporal, Postgres, and Temporal UI
- `npm run services:up` — build and start app service containers
- `npm run services:stop` — stop app service containers
- `npm run temporal:down` — stop Temporal infrastructure
- `npm run build` — typecheck the frontend and server, then build the frontend
- `npm run preview` — preview the production build

## How it works

1. Menu and modifier endpoints return data directly over HTTP.
2. The Order API accepts `POST /api/orders` and starts `orderFulfillmentWorkflow` with `workflowId = orderId`.
3. The API immediately returns `202 Accepted`; Temporal owns the remaining work.
4. The worker runs payment authorization, POS submission, and restaurant acceptance as activities.
5. Activities update the Order Status service over HTTP; SQLite stores the read model.
6. The browser polls `GET /api/order-status/:orderId` and displays live progress.
7. Payment and POS use Temporal retry policies; the demo intentionally fails the first POS attempt.
8. `POST /api/orders/:orderId/cancel` requests cancellation of the workflow (Temporal's native cancellation). If payment was authorized, the workflow refunds before marking the order cancelled.

Task queue default: `quickbite-orders`.

## Temporal configuration

```bash
TEMPORAL_ADDRESS=localhost:7233 \
TEMPORAL_NAMESPACE=default \
TEMPORAL_ORDER_TASK_QUEUE=quickbite-orders \
ORDER_STATUS_BASE_URL=http://localhost:3002 \
npm run dev
```
