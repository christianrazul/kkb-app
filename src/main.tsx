import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './app/providers/AuthProvider'
import { CurrencyProvider } from './app/providers/CurrencyProvider'
import { DataProvider } from './app/providers/DataProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
