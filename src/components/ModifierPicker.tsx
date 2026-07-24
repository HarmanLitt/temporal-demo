import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material'
import { fetchModifiers } from '../api/modifiersApi'
import type { MenuItem, Modifier } from '../types'

type ModifierPickerProps = {
  open: boolean
  menuItem: MenuItem | null
  onClose: () => void
  onAddToCart: (menuItem: MenuItem, modifiers: Modifier[]) => void
}

function groupModifiers(modifiers: Modifier[]) {
  const groups = new Map<string, Modifier[]>()
  for (const modifier of modifiers) {
    const list = groups.get(modifier.group) ?? []
    list.push(modifier)
    groups.set(modifier.group, list)
  }
  return groups
}

export function ModifierPicker({
  open,
  menuItem,
  onClose,
  onAddToCart,
}: ModifierPickerProps) {
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open || !menuItem) {
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setSelectedIds(new Set())
      try {
        const data = await fetchModifiers(menuItem!.id)
        if (cancelled) return
        setModifiers(data)

        // Pre-select the first option in each single-choice group.
        const defaults = new Set<string>()
        const groups = groupModifiers(data)
        for (const groupMods of groups.values()) {
          const firstSingle = groupMods.find((mod) => mod.type === 'single')
          if (firstSingle) {
            defaults.add(firstSingle.id)
          }
        }
        setSelectedIds(defaults)
      } catch {
        if (!cancelled) {
          setError('Could not load modifiers. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [open, menuItem])

  const groups = useMemo(() => groupModifiers(modifiers), [modifiers])

  const selectedModifiers = modifiers.filter((mod) => selectedIds.has(mod.id))
  const extrasTotal = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0)
  const lineTotal = menuItem ? menuItem.price + extrasTotal : 0

  function handleSingleChange(group: string, modifierId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const groupMods = groups.get(group) ?? []
      for (const mod of groupMods) {
        if (mod.type === 'single') {
          next.delete(mod.id)
        }
      }
      next.add(modifierId)
      return next
    })
  }

  function handleMultiToggle(modifierId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(modifierId)) {
        next.delete(modifierId)
      } else {
        next.add(modifierId)
      }
      return next
    })
  }

  function handleAdd() {
    if (!menuItem) return
    onAddToCart(menuItem, selectedModifiers)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {menuItem?.name ?? 'Customize item'}
        {menuItem && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {menuItem.description}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && (
          <Stack spacing={3}>
            {[...groups.entries()].map(([groupName, groupMods]) => {
              const isSingle = groupMods[0]?.type === 'single'
              if (isSingle) {
                const selected = groupMods.find((mod) => selectedIds.has(mod.id))?.id ?? ''
                return (
                  <FormControl key={groupName} component="fieldset" variant="standard">
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                      {groupName}
                    </FormLabel>
                    <RadioGroup
                      value={selected}
                      onChange={(event) => handleSingleChange(groupName, event.target.value)}
                    >
                      {groupMods.map((mod) => (
                        <FormControlLabel
                          key={mod.id}
                          value={mod.id}
                          control={<Radio />}
                          label={`${mod.name}${mod.price > 0 ? ` (+$${mod.price.toFixed(2)})` : ''}`}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )
              }

              return (
                <FormControl key={groupName} component="fieldset" variant="standard">
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                    {groupName}
                  </FormLabel>
                  <FormGroup>
                    {groupMods.map((mod) => (
                      <FormControlLabel
                        key={mod.id}
                        control={
                          <Checkbox
                            checked={selectedIds.has(mod.id)}
                            onChange={() => handleMultiToggle(mod.id)}
                          />
                        }
                        label={`${mod.name}${mod.price > 0 ? ` (+$${mod.price.toFixed(2)})` : ''}`}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              )
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={!menuItem || loading || Boolean(error)}
        >
          Add to cart · ${lineTotal.toFixed(2)}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
