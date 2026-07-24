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
