import type { MenuItem } from '../types'

export const menuItems: MenuItem[] = [
  {
    id: 'big-mac',
    name: 'Big Mac',
    description: 'Two beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame bun.',
    price: 5.99,
    category: 'Burgers',
  },
  {
    id: 'quarter-pounder',
    name: 'Quarter Pounder with Cheese',
    description: 'A quarter pound of beef with melted cheese, onions, pickles, ketchup, and mustard.',
    price: 6.49,
    category: 'Burgers',
  },
  {
    id: 'mcchicken',
    name: 'McChicken',
    description: 'Crispy chicken patty with lettuce and mayonnaise on a toasted bun.',
    price: 3.99,
    category: 'Chicken',
  },
  {
    id: 'nuggets',
    name: 'Chicken McNuggets (10 pc)',
    description: 'Bite-sized chicken pieces, perfect with your favorite dipping sauce.',
    price: 5.49,
    category: 'Chicken',
  },
  {
    id: 'fries',
    name: 'World Famous Fries',
    description: 'Golden, crispy fries cooked to order.',
    price: 2.79,
    category: 'Sides',
  },
  {
    id: 'apple-pie',
    name: 'Baked Apple Pie',
    description: 'Warm apple pie with a flaky crust.',
    price: 1.89,
    category: 'Sides',
  },
  {
    id: 'coke',
    name: 'Coca-Cola',
    description: 'Ice-cold Coca-Cola soft drink.',
    price: 1.99,
    category: 'Drinks',
  },
  {
    id: 'shake',
    name: 'Chocolate Shake',
    description: 'Creamy chocolate milkshake topped with whipped cream.',
    price: 3.79,
    category: 'Drinks',
  },
]
