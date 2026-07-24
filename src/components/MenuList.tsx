import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'
import type { MenuItem } from '../types'

type MenuListProps = {
  items: MenuItem[]
  onSelectItem: (item: MenuItem) => void
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`
}

export function MenuList({ items, onSelectItem }: MenuListProps) {
  const categories = [...new Set(items.map((item) => item.category))]

  return (
    <Stack spacing={4}>
      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category)
        return (
          <Box key={category}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {category}
            </Typography>
            <Stack spacing={1.5}>
              {categoryItems.map((item) => (
                <Card
                  key={item.id}
                  variant="outlined"
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { sm: 'stretch' },
                    transition: 'border-color 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1, pb: { xs: 1, sm: 2 } }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                    >
                      <Box>
                        <Typography variant="h6" component="h3">
                          {item.name}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 480 }}>
                          {item.description}
                        </Typography>
                      </Box>
                      <Typography
                        color="primary.dark"
                        sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}
                      >
                        {formatPrice(item.price)}
                      </Typography>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, alignItems: 'center' }}>
                    <Button variant="contained" onClick={() => onSelectItem(item)}>
                      Customize
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Stack>
          </Box>
        )
      })}
    </Stack>
  )
}
