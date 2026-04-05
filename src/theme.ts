import { createTheme, alpha } from '@mui/material/styles';

const PRIMARY_MAIN = '#164993';
const SECONDARY_MAIN = '#e63c2e';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: PRIMARY_MAIN,
      light: '#2F6FB6',
      dark: '#101e30',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: SECONDARY_MAIN,
      light: '#e9564f',
      dark: '#b01b13',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#f4f6f9',
      paper: '#FFFFFF',
    },
    divider: alpha(PRIMARY_MAIN, 0.1),
    text: {
      primary: '#1e293b',
      secondary: PRIMARY_MAIN,
    },
    success: {
      main: '#10b981',
      light: '#d1fae5',
      dark: '#065f46',
    },
    error: {
      main: '#e63c2e',
      light: '#f18883',
      dark: '#b01b13',
    },
    warning: {
      main: '#f59e0b',
      light: '#fef3c7',
      dark: '#92400e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#1e293b',
      fontFamily: '"Outfit", sans-serif',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#1e293b',
      fontFamily: '"Outfit", sans-serif',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#1e293b',
      fontFamily: '"Outfit", sans-serif',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#1e293b',
      fontFamily: '"Outfit", sans-serif',
    },
    subtitle1: {
      color: PRIMARY_MAIN,
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          padding: '8px 20px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          border: '1px solid #D9D9D9',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            backgroundColor: '#f8fafc',
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: alpha(PRIMARY_MAIN, 0.2),
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1e293b',
          boxShadow: 'none',
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
  },
});
