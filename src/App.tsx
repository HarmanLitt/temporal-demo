import { useEffect, useState } from 'react'
import {
  Alert,
  AppBar,
  Box,
  CircularProgress,
  Container,
  Grid,
  Toolbar,
  Typography,
} from '@mui/material'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import { fetchMenu } from './api/menuApi'
import { cancelOrder, fetchOrderStatus, submitOrder } from './api/ordersApi'
import { Cart, getCartTotals } from './components/Cart'
import { MenuList } from './components/MenuList'
import { ModifierPicker } from './components/ModifierPicker'
import { OrderProgress } from './components/OrderProgress'
import { RestaurantHeader } from './components/RestaurantHeader'
import type { CartLine, MenuItem, Modifier, OrderStatus } from './types'

function createLineId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function App() {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError] = useState<string | null>(null)

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [modifierOpen, setModifierOpen] = useState(false)

  const [cart, setCart] = useState<CartLine[]>([])
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState(false)
  const activeOrderId = orderStatus?.orderId
  const activeOrderStage = orderStatus?.status

  useEffect(() => {
    let cancelled = false

    async function loadMenu() {
      setMenuLoading(true)
      setMenuError(null)
      try {
        const items = await fetchMenu()
        if (!cancelled) {
          setMenu(items)
        }
      } catch {
        if (!cancelled) {
          setMenuError('Could not load the menu. Please refresh and try again.')
        }
      } finally {
        if (!cancelled) {
          setMenuLoading(false)
        }
      }
    }

    void loadMenu()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (
      !activeOrderId ||
      !activeOrderStage ||
      ['confirmed', 'cancelled', 'failed'].includes(activeOrderStage)
    ) {
      return
    }

    let stopped = false
    const pollStatus = async () => {
      try {
        const nextStatus = await fetchOrderStatus(activeOrderId)
        if (!stopped) {
          setOrderStatus(nextStatus)
          setOrderError(null)
        }
      } catch {
        if (!stopped) {
          setOrderError('Could not refresh the order status. Retrying…')
        }
      }
    }

    const interval = window.setInterval(() => void pollStatus(), 500)
    void pollStatus()

    return () => {
      stopped = true
      window.clearInterval(interval)
    }
  }, [activeOrderId, activeOrderStage])

  function handleSelectItem(item: MenuItem) {
    setSelectedItem(item)
    setModifierOpen(true)
  }

  function handleAddToCart(menuItem: MenuItem, modifiers: Modifier[]) {
    setCart((prev) => [
      ...prev,
      {
        id: createLineId(),
        menuItem,
        modifiers,
        quantity: 1,
      },
    ])
    setOrderError(null)
  }

  function handleRemoveLine(lineId: string) {
    setCart((prev) => prev.filter((line) => line.id !== lineId))
  }

  async function handlePlaceOrder() {
    setPlacingOrder(true)
    setOrderError(null)
    try {
      const { total } = getCartTotals(cart)
      const result = await submitOrder({
        orderId: `QB-${crypto.randomUUID()}`,
        restaurantId: 'mcdonalds-demo',
        items: cart,
        total,
        restaurant: "McDonald's",
      })
      setOrderStatus(result)
      setCart([])
    } catch {
      setOrderError('Could not place your order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  async function handleCancelOrder() {
    if (!orderStatus) return

    setCancellingOrder(true)
    setOrderError(null)
    try {
      const update = await cancelOrder(
        orderStatus.orderId,
        orderStatus.restaurantId,
      )
      setOrderStatus((current) =>
        current ? { ...current, ...update } : current,
      )
    } catch {
      setOrderError('Could not cancel the order. Please try again.')
    } finally {
      setCancellingOrder(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', pb: 6 }}>
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <RestaurantMenuIcon sx={{ mr: 1.25 }} />
          <Typography
            variant="h5"
            component="div"
            sx={{
              flexGrow: 1,
              fontFamily: '"Fraunces", Georgia, serif',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            QuickBite
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Food delivery
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <RestaurantHeader />

        {menuError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {menuError}
          </Alert>
        )}
        {orderError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOrderError(null)}>
            {orderError}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {menuLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <MenuList items={menu} onSelectItem={handleSelectItem} />
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Cart
              lines={cart}
              placingOrder={placingOrder}
              onRemoveLine={handleRemoveLine}
              onPlaceOrder={handlePlaceOrder}
            />
          </Grid>
        </Grid>
      </Container>

      <ModifierPicker
        open={modifierOpen}
        menuItem={selectedItem}
        onClose={() => setModifierOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <OrderProgress
        status={orderStatus}
        cancelling={cancellingOrder}
        onCancel={() => void handleCancelOrder()}
        onClose={() => setOrderStatus(null)}
      />
    </Box>
  )
}
