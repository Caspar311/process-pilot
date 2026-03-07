import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'
import { ProcessViewer } from './components/ProcessViewer'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen py-8">
        <ProcessViewer />
      </div>
    </ThemeProvider>
  )
}

export default App
