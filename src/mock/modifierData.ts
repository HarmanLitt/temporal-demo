import type { Modifier } from '../types'

const sharedSize: Modifier[] = [
  { id: 'size-regular', name: 'Regular', price: 0, type: 'single', group: 'Size' },
  { id: 'size-large', name: 'Large', price: 0.7, type: 'single', group: 'Size' },
]

const burgerMods: Modifier[] = [
  ...sharedSize,
  { id: 'extra-cheese', name: 'Extra cheese', price: 0.5, type: 'multi', group: 'Add-ons' },
  { id: 'bacon', name: 'Add bacon', price: 1.0, type: 'multi', group: 'Add-ons' },
  { id: 'no-pickles', name: 'No pickles', price: 0, type: 'multi', group: 'Removals' },
  { id: 'no-onions', name: 'No onions', price: 0, type: 'multi', group: 'Removals' },
  { id: 'no-sauce', name: 'No sauce', price: 0, type: 'multi', group: 'Removals' },
]

const chickenMods: Modifier[] = [
  ...sharedSize,
  { id: 'sauce-bbq', name: 'BBQ sauce', price: 0, type: 'multi', group: 'Sauces' },
  { id: 'sauce-ranch', name: 'Ranch', price: 0, type: 'multi', group: 'Sauces' },
  { id: 'sauce-sweet-sour', name: 'Sweet & sour', price: 0, type: 'multi', group: 'Sauces' },
  { id: 'extra-sauce', name: 'Extra sauce pack', price: 0.3, type: 'multi', group: 'Add-ons' },
]

const friesMods: Modifier[] = [
  { id: 'fries-small', name: 'Small', price: 0, type: 'single', group: 'Size' },
  { id: 'fries-medium', name: 'Medium', price: 0.4, type: 'single', group: 'Size' },
  { id: 'fries-large', name: 'Large', price: 0.8, type: 'single', group: 'Size' },
  { id: 'no-salt', name: 'No salt', price: 0, type: 'multi', group: 'Options' },
]

const drinkMods: Modifier[] = [
  { id: 'drink-small', name: 'Small', price: 0, type: 'single', group: 'Size' },
  { id: 'drink-medium', name: 'Medium', price: 0.3, type: 'single', group: 'Size' },
  { id: 'drink-large', name: 'Large', price: 0.6, type: 'single', group: 'Size' },
  { id: 'extra-ice', name: 'Extra ice', price: 0, type: 'multi', group: 'Options' },
  { id: 'no-ice', name: 'No ice', price: 0, type: 'multi', group: 'Options' },
]

const shakeMods: Modifier[] = [
  { id: 'whip-cream', name: 'Whipped cream', price: 0, type: 'multi', group: 'Toppings' },
  { id: 'no-whip', name: 'No whipped cream', price: 0, type: 'multi', group: 'Toppings' },
  { id: 'cherry', name: 'Add cherry', price: 0.25, type: 'multi', group: 'Toppings' },
]

const pieMods: Modifier[] = [
  { id: 'warm', name: 'Served warm', price: 0, type: 'single', group: 'Serving' },
  { id: 'room-temp', name: 'Room temperature', price: 0, type: 'single', group: 'Serving' },
]

export const modifiersByMenuItemId: Record<string, Modifier[]> = {
  'big-mac': burgerMods,
  'quarter-pounder': burgerMods,
  mcchicken: chickenMods,
  nuggets: chickenMods,
  fries: friesMods,
  'apple-pie': pieMods,
  coke: drinkMods,
  shake: shakeMods,
}
