# QuickBite

Food delivery UI demo. Browse a McDonald’s menu, pick modifiers, and place an order. Menu, modifiers, and order placement are mocked Kafka events in the browser.

## Stack

- Vite + React + TypeScript
- Material UI

## Run locally

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck and production build
- `npm run preview` — preview the production build

## How it works

1. The app loads the menu via a mocked Kafka `menu.request` / `menu.response` flow.
2. Selecting an item loads modifiers via `modifiers.request` / `modifiers.response`.
3. Placing an order publishes `order.place` and receives `order.confirmed`.

See `src/kafka/mockKafka.ts` for the mock event helpers.
