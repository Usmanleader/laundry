'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Service } from '@/types/database'

// Cart item structure
export interface CartItem {
  service: Service
  quantity: number
  weight?: number // For per-kg services
}

// Cart context type
interface CartContextType {
  cart: CartItem[]
  addToCart: (service: Service, quantity?: number, weight?: number) => void
  removeFromCart: (serviceId: string) => void
  updateQuantity: (serviceId: string, quantity: number) => void
  updateWeight: (serviceId: string, weight: number) => void
  clearCart: () => void
  getItemCount: () => number
  getSubtotal: () => number
  getItemPrice: (item: CartItem) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Local storage key
const CART_STORAGE_KEY = 'washerman-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        setCart(parsedCart)
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
    }
    setIsInitialized(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
      } catch (error) {
        console.error('Error saving cart to localStorage:', error)
      }
    }
  }, [cart, isInitialized])

  // Add item to cart
  const addToCart = (service: Service, quantity: number = 1, weight?: number) => {
    setCart(currentCart => {
      const existingIndex = currentCart.findIndex(item => item.service.id === service.id)
      
      if (existingIndex >= 0) {
        // Update existing item
        const updatedCart = [...currentCart]
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + quantity,
          weight: weight || updatedCart[existingIndex].weight,
        }
        return updatedCart
      } else {
        // Add new item
        return [...currentCart, { service, quantity, weight }]
      }
    })
  }

  // Remove item from cart
  const removeFromCart = (serviceId: string) => {
    setCart(currentCart => currentCart.filter(item => item.service.id !== serviceId))
  }

  // Update quantity
  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(serviceId)
      return
    }
    
    setCart(currentCart => 
      currentCart.map(item => 
        item.service.id === serviceId 
          ? { ...item, quantity } 
          : item
      )
    )
  }

  // Update weight (for per-kg services)
  const updateWeight = (serviceId: string, weight: number) => {
    setCart(currentCart => 
      currentCart.map(item => 
        item.service.id === serviceId 
          ? { ...item, weight } 
          : item
      )
    )
  }

  // Clear entire cart
  const clearCart = () => {
    setCart([])
    // Also immediately clear localStorage to ensure it's gone even if page redirects
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  // Get total item count
  const getItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Calculate price for a single cart item
  const getItemPrice = (item: CartItem) => {
    // If service has price_per_kg and weight is provided, use that
    if (item.service.price_per_kg && item.weight) {
      return item.service.price_per_kg * item.weight * item.quantity
    }
    // Otherwise use base_price
    return item.service.base_price * item.quantity
  }

  // Get cart subtotal
  const getSubtotal = () => {
    return cart.reduce((total, item) => total + getItemPrice(item), 0)
  }

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateWeight,
      clearCart,
      getItemCount,
      getSubtotal,
      getItemPrice,
    }}>
      {children}
    </CartContext.Provider>
  )
}

// Custom hook to use cart
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
