import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import SyncIcon from '@mui/icons-material/Sync'
import type { OrderStage, OrderStatus } from '../types'

const steps = ['Payment authorization', 'POS submission', 'Restaurant acceptance']

const activeStepByStatus: Record<OrderStage, number> = {
  pending: 0,
  authorizing_payment: 0,
  payment_authorized: 1,
  submitting_pos: 1,
  waiting_restaurant: 2,
  cancellation_requested: 2,
  voiding_pos: 1,
  refunding: 2,
  confirmed: 3,
  cancelled: 2,
  failed: 2,
}

const terminalStatuses = new Set<OrderStage>([
  'confirmed',
  'cancelled',
  'failed',
])

type OrderProgressProps = {
  status: OrderStatus | null
  cancelling: boolean
  onCancel: () => void
  onClose: () => void
}

export function OrderProgress({
  status,
  cancelling,
  onCancel,
  onClose,
}: OrderProgressProps) {
  if (!status) return null

  const terminal = terminalStatuses.has(status.status)
  const canCancel =
    !terminal &&
    status.status !== 'cancellation_requested' &&
    status.status !== 'voiding_pos' &&
    status.status !== 'refunding'

  const title =
    status.status === 'confirmed'
      ? 'Order confirmed'
      : status.status === 'cancelled'
        ? 'Order cancelled'
        : status.status === 'failed'
          ? 'Order failed'
          : 'Processing your order'

  return (
    <Dialog
      open
      onClose={terminal ? onClose : undefined}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {status.status === 'confirmed' ? (
          <CheckCircleOutlinedIcon color="success" />
        ) : status.status === 'cancelled' || status.status === 'failed' ? (
          <CancelOutlinedIcon color="error" />
        ) : (
          <SyncIcon color="primary" />
        )}
        {title}
      </DialogTitle>

      <DialogContent>
        {!terminal && <LinearProgress sx={{ mb: 3 }} />}

        <Stepper activeStep={activeStepByStatus[status.status]} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Alert
          severity={
            status.status === 'confirmed'
              ? 'success'
              : status.status === 'failed'
                ? 'error'
                : status.status === 'cancelled'
                  ? 'warning'
                  : 'info'
          }
          sx={{ mb: 2 }}
        >
          {status.message}
        </Alert>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {status.paymentAuthorized && (
            <Chip size="small" color="success" label="Payment authorized" />
          )}
          {status.refunded && (
            <Chip size="small" color="warning" label="Payment refunded" />
          )}
          {status.posVoided && (
            <Chip size="small" color="warning" label="POS ticket voided" />
          )}
          {status.attempt && status.maxAttempts && (
            <Chip
              size="small"
              label={`Attempt ${status.attempt} of ${status.maxAttempts}`}
            />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary">
          Order ID: <strong>{status.orderId}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Items: {status.itemCount}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total: ${status.total.toFixed(2)}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {canCancel && (
          <Button color="error" onClick={onCancel} disabled={cancelling}>
            {cancelling ? 'Requesting cancellation…' : 'Cancel order'}
          </Button>
        )}
        {terminal && (
          <Button variant="contained" onClick={onClose}>
            Back to menu
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
