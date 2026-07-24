import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F6B5C',
      dark: '#0A4F44',
      light: '#1A8A77',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E07A3D',
      dark: '#C45F24',
      light: '#F0945C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F3F6F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2421',
      secondary: '#5A6B66',
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
  },
})
