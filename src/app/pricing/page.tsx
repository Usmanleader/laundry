import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Transparent pricing for all our laundry services. No hidden fees.',
}

const mainServices = [
  {
    name: 'Wash & Fold',
    price: 120,
    unit: 'per kg',
    description: 'Regular clothes washing and folding',
    features: [
      'Premium detergent',
      'Tumble dry',
      'Neatly folded',
      'Packaged in bags',
    ],
    minOrder: '3 kg',
  },
  {
    name: 'Dry Cleaning',
    price: 250,
    unit: 'per kg',
    description: 'Professional solvent cleaning',
    features: [
      'Solvent cleaning',
      'Stain treatment',
      'Pressed & finished',
      'Garment bags included',
    ],
    minOrder: 'No minimum',
    popular: true,
  },
  {
    name: 'Ironing Only',
    price: 80,
    unit: 'per kg',
    description: 'Steam pressing service',
    features: [
      'Steam pressing',
      'Crease setting',
      'Hanger delivery',
      'Same day available',
    ],
    minOrder: '2 kg',
  },
  {
    name: 'Premium Laundry',
    price: 350,
    unit: 'per kg',
    description: 'Luxury laundry service',
    features: [
      'Premium products',
      'Individual care',
      'Priority handling',
      'Fragrance options',
    ],
    minOrder: '2 kg',
  },
]

const itemPricing = [
  { category: 'Formal Wear', items: [
    { name: 'Suit (2-piece)', price: 800 },
    { name: 'Suit (3-piece)', price: 1000 },
    { name: 'Blazer/Sports Coat', price: 500 },
    { name: 'Formal Pants', price: 250 },
    { name: 'Dress Shirt', price: 200 },
    { name: 'Tie', price: 150 },
  ]},
  { category: 'Traditional Wear', items: [
    { name: 'Sherwani', price: 1200 },
    { name: 'Kurta Shalwar', price: 400 },
    { name: 'Saree (Plain)', price: 500 },
    { name: 'Saree (Heavy)', price: 800 },
    { name: 'Lehenga', price: 1500 },
    { name: 'Dupatta', price: 200 },
  ]},
  { category: 'Casual Wear', items: [
    { name: 'Jeans', price: 200 },
    { name: 'T-Shirt', price: 100 },
    { name: 'Polo Shirt', price: 150 },
    { name: 'Shorts', price: 120 },
    { name: 'Sweater', price: 300 },
    { name: 'Jacket', price: 400 },
  ]},
  { category: 'Home Items', items: [
    { name: 'Bed Sheet (Single)', price: 200 },
    { name: 'Bed Sheet (Double)', price: 300 },
    { name: 'Duvet Cover', price: 400 },
    { name: 'Pillow Cover', price: 80 },
    { name: 'Blanket (Small)', price: 400 },
    { name: 'Blanket (Large)', price: 600 },
  ]},
]

const deliveryFees = [
  { area: 'DHA Phase 1-6', fee: 150 },
  { area: 'DHA Phase 7-8', fee: 175 },
  { area: 'Clifton', fee: 150 },
  { area: 'PECHS', fee: 150 },
  { area: 'Gulshan-e-Iqbal', fee: 175 },
  { area: 'Gulistan-e-Johar', fee: 175 },
  { area: 'North Nazimabad', fee: 200 },
  { area: 'Bahria Town', fee: 250 },
  { area: 'Other Areas', fee: 200 },
]

const faqs = [
  {
    question: 'Is there a minimum order amount?',
    answer: 'Yes, minimum order varies by service. Wash & Fold requires 3kg minimum, Ironing requires 2kg minimum. Dry cleaning has no minimum.',
  },
  {
    question: 'Do you offer free pickup and delivery?',
    answer: 'Pickup is free for orders above Rs. 500. Delivery charges vary by area and are shown above.',
  },
  {
    question: 'How do you charge for dry cleaning?',
    answer: 'Dry cleaning can be charged per kg or per item. For delicate items, we recommend per-item pricing for better care.',
  },
  {
    question: 'Are there any hidden charges?',
    answer: 'No hidden charges! The prices shown include all processing. Only delivery fee is additional and shown clearly at checkout.',
  },
  {
    question: 'Do you offer discounts for bulk orders?',
    answer: 'Yes! We offer 10% discount on orders above 10kg and 15% for corporate accounts. Contact us for details.',
  },
]

export default function PricingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            No hidden fees. Pay only for what you use. Quality laundry at affordable prices.
          </p>
        </div>
      </section>

      {/* Main Services Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Service Pricing</h2>
            <p className="mt-4 text-gray-600">Choose the service that fits your needs</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainServices.map((service, index) => (
              <Card 
                key={index} 
                className={`relative ${service.popular ? 'border-2 border-blue-600 shadow-xl' : 'shadow-lg'}`}
              >
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    POPULAR
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{service.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">Rs. {service.price}</span>
                    <span className="text-gray-500">/{service.unit}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{service.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                    <span className="text-sm text-gray-600">Min: {service.minOrder}</span>
                  </div>
                  <Link href="/booking" className="mt-4 block">
                    <Button className="w-full" variant={service.popular ? 'default' : 'outline'}>
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Item-wise Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Dry Cleaning - Per Item Pricing</h2>
            <p className="mt-4 text-gray-600">For delicate items, we recommend per-item dry cleaning</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {itemPricing.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {category.items.map((item, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium text-gray-900">Rs. {item.price}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Fees */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Delivery Charges</h2>
            <p className="mt-4 text-gray-600">Free pickup for orders above Rs. 500</p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {deliveryFees.map((area, index) => (
                    <div key={index} className="flex justify-between py-2 border-b last:border-0">
                      <span className="text-gray-600">{area.area}</span>
                      <span className="font-medium text-gray-900">Rs. {area.fee}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                      <p className="mt-2 text-gray-600">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="mt-4 text-xl text-blue-100">
            Use code WELCOME20 for 20% off your first order
          </p>
          <Link href="/booking" className="mt-8 inline-block">
            <Button size="xl" className="bg-white text-blue-600 hover:bg-blue-50">
              Book Your Pickup
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
