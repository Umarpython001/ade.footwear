import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Import AuthProvider: my auth session provider (context/Auth.tsx); publishes signed-in state via useAuth().
import { AuthProvider } from './context/Auth.tsx'
import { CartProvider } from './context/Cart.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* AuthProvider wraps everything: I added this so useAuth() works in any page (Orders, Checkout). */}
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    {/* Close the AuthProvider I added above. */}
    </AuthProvider>
  </StrictMode>,
)
