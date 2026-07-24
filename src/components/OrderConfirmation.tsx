import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import type { OrderConfirmation as OrderConfirmationType } from '../types'

type OrderConfirmationProps = {
  open: boolean
  confirmation: OrderConfirmationType | null
  onClose: () => void
}

export function OrderConfirmation({
  open,
  confirmation,
  onClose,
}: OrderConfirmationProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircleOutlinedIcon color="primary" />
        Order confirmed
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 1.5 }}>
          QuickBite has received your order from {confirmation?.restaurant}.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Order ID: <strong>{confirmation?.orderId}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Items: {confirmation?.itemCount}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total: ${confirmation?.total.toFixed(2)}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose}>
          Back to menu
        </Button>
      </DialogActions>
    </Dialog>
  )
}
