import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  cssVariables: true, // Use M3 CSS variables
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#0b57d0', // M3 Primary
          light: '#a8c7fa', // M3 Primary Container
        },
        secondary: {
          main: '#5e5e5e', // M3 Secondary
          light: '#e3e3e3', // M3 Secondary Container
        },
        background: {
          default: '#fdfbff', // M3 Surface
          paper: '#ffffff',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#a8c7fa',
          dark: '#0842a0',
        },
        secondary: {
          main: '#c7c7c7',
          dark: '#474747',
        },
        background: {
          default: '#1a1c1e',
          paper: '#1a1c1e',
        },
      },
    },
  },
  typography: {
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24, // M3 Card border radius
          boxShadow: '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)', // Elevation 1
          transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)', // Elevation 2
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 100, // Fully rounded for M3 buttons
          textTransform: 'none', // No all-caps
          fontWeight: 500,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h1: {
          fontSize: '2.5rem',
          lineHeight: 1.2,
          fontWeight: 400,
        },
        h2: {
          fontSize: '2rem',
          lineHeight: 1.25,
          fontWeight: 400,
        },
        h3: {
          fontSize: '1.5rem',
          lineHeight: 1.33,
          fontWeight: 400,
        },
      },
    },
  },
})

export default theme
