import { Box, Chip, Stack, Typography } from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PedalBikeIcon from '@mui/icons-material/PedalBike'

export function RestaurantHeader() {
  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        background:
          'linear-gradient(135deg, rgba(15, 107, 92, 0.08) 0%, rgba(224, 122, 61, 0.1) 100%)',
        border: '1px solid',
        borderColor: 'rgba(15, 107, 92, 0.12)',
      }}
    >
      <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.2 }}>
        Ordering from
      </Typography>
      <Typography
        variant="h3"
        component="h1"
        sx={{ mt: 0.5, mb: 1, fontSize: { xs: '2rem', md: '2.5rem' } }}
      >
        McDonald&apos;s
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 520, mb: 2 }}>
        Burgers, fries, and classics delivered to your door through QuickBite.
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Chip
          icon={<AccessTimeIcon />}
          label="25–35 min"
          size="small"
          variant="outlined"
          color="primary"
        />
        <Chip
          icon={<PedalBikeIcon />}
          label="$2.99 delivery"
          size="small"
          variant="outlined"
        />
        <Chip label="American · Fast food" size="small" variant="outlined" />
      </Stack>
    </Box>
  )
}
