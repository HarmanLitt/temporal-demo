import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import type { CartLine } from '../types'

type CartProps = {
  lines: CartLine[]
  placingOrder: boolean
  onRemoveLine: (lineId: string) => void
  onPlaceOrder: () => void
}

function lineTotal(line: CartLine) {
  const modifiersTotal = line.modifiers.reduce((sum, mod) => sum + mod.price, 0)
  return (line.menuItem.price + modifiersTotal) * line.quantity
}

export function Cart({ lines, placingOrder, onRemoveLine, onPlaceOrder }: CartProps) {
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0)
  const deliveryFee = lines.length > 0 ? 2.99 : 0
  const total = subtotal + deliveryFee

  return (
    <Box
      sx={{
        position: { md: 'sticky' },
        top: { md: 88 },
        p: 2.5,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 8px 24px rgba(26, 36, 33, 0.06)',
      }}
    >
      <Typography variant="h5" sx={{ mb: 2 }}>
        Your cart
      </Typography>

      {lines.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Add items from McDonald&apos;s to get started.
        </Typography>
      ) : (
        <Stack spacing={2} sx={{ mb: 2 }}>
          {lines.map((line) => (
            <Box key={line.id}>
              <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Box sx={{ pr: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {line.quantity}× {line.menuItem.name}
                  </Typography>
                  {line.modifiers.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {line.modifiers.map((mod) => mod.name).join(', ')}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 600 }}>${lineTotal(line).toFixed(2)}</Typography>
                  <IconButton
                    aria-label={`Remove ${line.menuItem.name}`}
                    size="small"
                    onClick={() => onRemoveLine(line.id)}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1} sx={{ mb: 2 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography color="text.secondary">Subtotal</Typography>
          <Typography>${subtotal.toFixed(2)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography color="text.secondary">Delivery</Typography>
          <Typography>${deliveryFee.toFixed(2)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }}>Total</Typography>
          <Typography sx={{ fontWeight: 700 }}>${total.toFixed(2)}</Typography>
        </Stack>
      </Stack>

      <Button
        fullWidth
        size="large"
        variant="contained"
        color="secondary"
        disabled={lines.length === 0 || placingOrder}
        onClick={onPlaceOrder}
      >
        {placingOrder ? 'Placing order…' : 'Place order'}
      </Button>
    </Box>
  )
}

export function getCartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0)
  const deliveryFee = lines.length > 0 ? 2.99 : 0
  return { subtotal, deliveryFee, total: subtotal + deliveryFee }
}
