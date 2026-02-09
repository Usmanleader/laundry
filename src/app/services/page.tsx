'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, Droplets, Wind, Sparkles, Star, ShoppingCart, Plus, Minus, ArrowRight, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/types/database'

// Fallback static services that match our database schema
const STATIC_SERVICES: Partial<Service>[] = [
  {
    id: 'wash-fold',
    name: 'Wash & Fold',
    description: 'Our most popular service. We wash, dry, and neatly fold your everyday clothes using premium detergents.',
    base_price: 120,
    price_per_kg: 120,
    price_per_unit: null,
    price_type: 'per_kg',
    category: 'wash-fold',
    estimated_duration: '24-48 hours',
    estimated_hours: 48,
    turnaround_hours: 48,
    is_active: true,
    image_url: null,
    features: ['Machine wash with premium detergent', 'Tumble dry at optimal temperature', 'Neatly folded and packaged', 'Eco-friendly detergent options'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning',
    description: 'Professional dry cleaning for your delicate and formal garments. We handle suits, dresses, and specialty fabrics with care.',
    base_price: 300,
    price_per_kg: null,
    price_per_unit: 300,
    price_type: 'per_piece',
    category: 'dry-cleaning',
    estimated_duration: '48-72 hours',
    estimated_hours: 72,
    turnaround_hours: 72,
    is_active: true,
    image_url: null,
    features: ['Professional solvent cleaning', 'Expert stain removal', 'Pressed and finished', 'Protective garment bags'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ironing',
    name: 'Ironing & Pressing',
    description: 'Get crisp, wrinkle-free clothes with our professional steam pressing service.',
    base_price: 80,
    price_per_kg: 80,
    price_per_unit: null,
    price_type: 'per_kg',
    category: 'ironing',
    estimated_duration: '12-24 hours',
    estimated_hours: 24,
    turnaround_hours: 24,
    is_active: true,
    image_url: null,
    features: ['Professional steam pressing', 'Collar and cuff attention', 'Crease setting for pants', 'Hanger or folded delivery'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'premium',
    name: 'Premium Laundry',
    description: 'Our luxury service for those who want the best. Premium detergents, special care, and priority handling.',
    base_price: 350,
    price_per_kg: 350,
    price_per_unit: null,
    price_type: 'per_kg',
    category: 'specialty',
    estimated_duration: '24-36 hours',
    estimated_hours: 36,
    turnaround_hours: 36,
    is_active: true,
    image_url: null,
    features: ['Hand-selected premium detergents', 'Individual item inspection', 'Color-separated washing', 'Premium fabric softener'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Items that can be cleaned for each service type
const serviceItems: Record<string, string[]> = {
  'wash-fold': ['T-shirts', 'Jeans', 'Casual wear', 'Towels', 'Bed sheets', 'Undergarments'],
  'dry-cleaning': ['Suits & Blazers', 'Formal dresses', 'Silk garments', 'Wool items', 'Leather jackets', 'Wedding attire'],
  'ironing': ['Dress shirts', 'Formal pants', 'Sarees', 'Kurtas', 'Table linens', 'Uniforms'],
  'premium': ['Designer clothes', 'Baby clothes', 'Sensitive skin garments', 'Luxury bedding', 'Fine fabrics', 'Cashmere'],
}

// Icon mapping
const getServiceIcon = (category: string) => {
  switch (category) {
    case 'wash-fold': return Droplets
    case 'dry-cleaning': return Wind
    case 'ironing': return Wind
    case 'specialty': return Sparkles
    default: return Droplets
  }
}

const additionalServices = [
  { name: 'Stain Removal', price: 'Rs. 100-500', description: 'Specialized treatment for tough stains' },
  { name: 'Alterations', price: 'From Rs. 200', description: 'Basic alterations and repairs' },
  { name: 'Shoe Cleaning', price: 'Rs. 300-800', description: 'Professional sneaker and shoe cleaning' },
  { name: 'Bag Cleaning', price: 'Rs. 500-2000', description: 'Handbag and luggage cleaning' },
  { name: 'Curtain Cleaning', price: 'Rs. 150/kg', description: 'Pickup, cleaning, and re-hanging' },
  { name: 'Carpet Cleaning', price: 'Rs. 50/sq.ft', description: 'Deep cleaning for rugs and carpets' },
]

// Individual Service Card with Add to Cart functionality
function ServiceCard({ 
  service, 
  index 
}: { 
  service: Service
  index: number 
}) {
  const router = useRouter()
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  
  // Check if this service is already in cart
  const cartItem = cart.find(item => item.service.id === service.id)
  const currentQuantity = cartItem?.quantity || 0
  
  // Get the icon component
  const IconComponent = getServiceIcon(service.category)
  const items = serviceItems[service.id] || serviceItems[service.category] || []
  
  // Handle adding to cart with visual feedback
  const handleAddToCart = () => {
    setIsAdding(true)
    addToCart(service, 1)
    
    // Reset animation after delay
    setTimeout(() => {
      setIsAdding(false)
    }, 500)
  }
  
  // Handle increment
  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(service.id, currentQuantity + 1)
    } else {
      handleAddToCart()
    }
  }
  
  // Handle decrement
  const handleDecrement = () => {
    if (currentQuantity > 1) {
      updateQuantity(service.id, currentQuantity - 1)
    } else if (currentQuantity === 1) {
      removeFromCart(service.id)
    }
  }
  
  // Handle "Book This Service" - add to cart and navigate
  const handleBookService = () => {
    if (!cartItem) {
      addToCart(service, 1)
    }
    router.push('/booking')
  }
  
  const isPopular = service.id === 'premium' || service.category === 'specialty'

  return (
    <div
      id={service.id}
      className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
    >
      <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
            <IconComponent className="h-6 w-6 text-sky-600" />
          </div>
          {isPopular && (
            <span className="px-3 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 rounded-full">
              MOST POPULAR
            </span>
          )}
          {currentQuantity > 0 && (
            <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-800 rounded-full flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              {currentQuantity} in cart
            </span>
          )}
        </div>
        <h2 className="mt-4 text-3xl font-bold text-gray-900">{service.name}</h2>
        <p className="mt-4 text-lg text-gray-600">{service.description}</p>
        
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sky-600">
            <Star className="h-5 w-5" />
            <span className="font-semibold">
              Rs. {service.base_price}
              {service.price_per_kg ? '/kg' : ' per item'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-5 w-5" />
            <span>{service.estimated_duration || '24-48 hours'}</span>
          </div>
        </div>

        <ul className="mt-6 grid sm:grid-cols-2 gap-3">
          {(service.features || []).slice(0, 6).map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-slate-600">
              <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {/* Quantity Controls */}
          {currentQuantity > 0 ? (
            <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={handleDecrement}
                className="p-3 hover:bg-slate-200 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="px-4 font-bold text-lg text-slate-900 min-w-[3rem] text-center">
                {currentQuantity}
              </span>
              <button
                onClick={handleIncrement}
                className="p-3 hover:bg-slate-200 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Button
              size="lg"
              variant="outline"
              onClick={handleAddToCart}
              className={`transition-all ${isAdding ? 'scale-95 bg-green-50' : ''}`}
            >
              <ShoppingCart className={`mr-2 h-5 w-5 ${isAdding ? 'animate-bounce' : ''}`} />
              Add to Cart
            </Button>
          )}
          
          {/* Book Now Button */}
          <Button 
            size="lg" 
            onClick={handleBookService}
            className="group"
          >
            {currentQuantity > 0 ? 'Proceed to Booking' : 'Book This Service'}
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">What We Clean</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {items.map((item, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-6 p-4 bg-sky-50 rounded-lg">
              <p className="text-sm text-sky-800">
                <strong>Starting Price:</strong> Rs. {service.base_price}
                {service.price_per_kg && ` (Rs. ${service.price_per_kg}/kg)`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Floating Cart Summary that shows when items are in cart
function FloatingCartSummary() {
  const router = useRouter()
  const { cart, getItemCount, getSubtotal } = useCart()
  
  if (cart.length === 0) return null
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-sky-500 text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <span className="font-semibold">{getItemCount()} services</span>
            <span className="mx-2">•</span>
            <span className="font-bold">Rs. {getSubtotal().toLocaleString()}</span>
          </div>
        </div>
        <Button
          onClick={() => router.push('/booking')}
          size="sm"
          className="bg-white text-sky-600 hover:bg-sky-50"
        >
          Checkout
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(STATIC_SERVICES as Service[])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Fetch services from database on mount
  useEffect(() => {
    async function fetchServices() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name')
        
        if (error) {
          console.error('Error fetching services:', error)
          // Keep using static services
        } else if (data && data.length > 0) {
          setServices(data)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchServices()
  }, [])

  return (
    <div className="py-12 bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-sky-500 to-sky-700 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Our Services</h1>
          <p className="mt-4 text-xl text-sky-100 max-w-2xl mx-auto">
            Professional laundry care for all your garments. Add services to your cart and book with ease.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sky-200">
            <ShoppingCart className="h-5 w-5" />
            <span>Click "Add to Cart" to select services, then proceed to booking</span>
          </div>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-16">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="grid lg:grid-cols-2 gap-12 items-center animate-pulse">
                  <div className="space-y-4">
                    <div className="h-12 w-12 bg-slate-200 rounded-xl" />
                    <div className="h-8 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-12 bg-slate-200 rounded w-1/3 mt-6" />
                  </div>
                  <div className="h-64 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {services.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Additional Services</h2>
            <p className="mt-4 text-lg text-slate-600">
              Beyond laundry, we offer specialized cleaning services
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
                  <p className="mt-1 text-sky-600 font-medium">{service.price}</p>
                  <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-sky-500">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Experience Premium Laundry?</h2>
          <p className="mt-4 text-xl text-sky-100">
            Schedule your first pickup today and enjoy 20% off!
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="xl" 
              className="bg-white text-sky-600 hover:bg-sky-50"
              onClick={() => router.push('/booking')}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              View Cart & Book Now
            </Button>
            <Button 
              size="xl" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10"
              onClick={() => router.push('/pricing')}
            >
              View Full Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Floating Cart Summary */}
      <FloatingCartSummary />
    </div>
  )
}
