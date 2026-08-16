import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import theme from './theme.js'
import { CartProvider } from './context/CartContext.jsx'
import { RecentlyViewedProvider } from './context/RecentlyViewedContext.jsx'
import { FavoritesProvider } from './context/FavoritesContext.jsx'
import { CompareProvider } from './context/CompareContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <RecentlyViewedProvider>
              <FavoritesProvider>
                <CompareProvider>
                  <App />
                </CompareProvider>
              </FavoritesProvider>
            </RecentlyViewedProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  </StrictMode>,
)
