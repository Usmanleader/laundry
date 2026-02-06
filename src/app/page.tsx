import Link from 'next/link'
import { ArrowRight, Truck, Clock, Shield, Sparkles, Star, CheckCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Truck,
    title: 'Free Pickup & Delivery',
    description: 'We pick up your clothes from your doorstep and deliver them back fresh and clean.',
  },
  {
    icon: Clock,
    title: '24-Hour Express Service',
    description: 'Need it fast? Our express service ensures your clothes are ready within 24 hours.',
  },
  {
    icon: Shield,
    title: 'Garment Protection',
    description: 'Your clothes are insured. We take full responsibility for every item we handle.',
  },
  {
    icon: Sparkles,
    title: 'Premium Quality',
    description: 'We use eco-friendly detergents and advanced equipment for the best results.',
  },
]

const services = [
  {
    title: 'Wash & Fold',
    price: 'Rs. 120/kg',
    description: 'Regular clothes washing with premium detergent',
    features: ['Machine Wash', 'Tumble Dry', 'Neatly Folded', 'Eco-friendly Detergent'],
  },
  {
    title: 'Dry Cleaning',
    price: 'Rs. 300+',
    description: 'Professional dry cleaning for delicate fabrics',
    features: ['Suits & Blazers', 'Formal Wear', 'Silk & Wool', 'Stain Removal'],
    popular: true,
  },
  {
    title: 'Ironing',
    price: 'Rs. 80/kg',
    description: 'Steam ironing for crisp, wrinkle-free clothes',
    features: ['Steam Pressing', 'Collar & Cuffs', 'Hanger Delivery', 'Same Day Available'],
  },
]

const testimonials = [
  {
    name: 'Ahmed Khan',
    location: 'DHA Phase 6',
    rating: 5,
    comment: 'Excellent service! My shirts have never looked better. The pickup and delivery is so convenient.',
  },
  {
    name: 'Fatima Ali',
    location: 'Clifton',
    rating: 5,
    comment: 'Finally found a reliable laundry service in Karachi. They handle my delicates with care.',
  },
  {
    name: 'Hassan Raza',
    location: 'Gulshan',
    rating: 5,
    comment: 'The express service saved me before an important meeting. Highly recommended!',
  },
]

const areas = [
  'DHA', 'Clifton', 'PECHS', 'Gulshan', 'Gulistan-e-Johar', 'North Nazimabad', 
  'Saddar', 'Garden', 'FB Area', 'Bahria Town'
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium text-blue-100 bg-white/20 rounded-full">
                🎉 20% OFF on your first order - Use code: WELCOME20
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Premium Laundry
                <br />
                <span className="text-blue-200">Delivered to Your Door</span>
              </h1>
              <p className="mt-6 text-lg text-blue-100 max-w-xl">
                Experience the convenience of professional laundry services across Karachi. 
                We pick up, clean, and deliver your clothes with care.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/booking">
                  <Button size="xl" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50">
                    Book Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                    View Pricing
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-sm">Free Pickup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-sm">48hr Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-sm">Insured</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-400 rounded-full opacity-30 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-300 rounded-full opacity-30 blur-3xl" />
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square rounded-2xl bg-white/20" />
                  ))}
                </div>
                <div className="mt-6 text-center text-white">
                  <div className="text-4xl font-bold">10,000+</div>
                  <div className="text-blue-200">Happy Customers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">
              Getting your laundry done has never been easier
            </p>
          </div>
          <div className="mt-16 grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Book Online', description: 'Schedule a pickup time that works for you' },
              { step: '2', title: 'We Pick Up', description: 'Our driver collects your laundry from your door' },
              { step: '3', title: 'We Clean', description: 'Expert cleaning with premium products' },
              { step: '4', title: 'We Deliver', description: 'Fresh clothes delivered back to you' },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold">
                  {item.step}
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-gray-300" />
                )}
                <h3 className="mt-6 text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Why Choose Washerman?</h2>
            <p className="mt-4 text-lg text-gray-600">
              We&apos;re committed to making your life easier with premium laundry services
            </p>
          </div>
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="service-card border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                    <feature.icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Our Services</h2>
            <p className="mt-4 text-lg text-gray-600">
              Professional care for all your garments
            </p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card 
                key={index} 
                className={`service-card relative overflow-hidden ${service.popular ? 'border-2 border-blue-600 shadow-xl' : 'border shadow-lg'}`}
              >
                {service.popular && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{service.title}</h3>
                  <div className="mt-2 text-3xl font-bold text-blue-600">{service.price}</div>
                  <p className="mt-2 text-gray-600">{service.description}</p>
                  <ul className="mt-6 space-y-3">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/booking" className="mt-6 block">
                    <Button className="w-full" variant={service.popular ? 'default' : 'outline'}>
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/services">
              <Button variant="outline" size="lg">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">What Our Customers Say</h2>
            <p className="mt-4 text-lg text-gray-600">
              Join thousands of happy customers across Karachi
            </p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="service-card shadow-lg">
                <CardContent className="p-6">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mt-4 text-gray-600 italic">&ldquo;{testimonial.comment}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">We Serve All of Karachi</h2>
            <p className="mt-4 text-lg text-gray-600">
              Pickup and delivery available in major areas
            </p>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {areas.map((area, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-white rounded-full text-gray-700 shadow-sm border hover:border-blue-500 hover:text-blue-600 transition-colors cursor-default"
              >
                {area}
              </span>
            ))}
          </div>
          <p className="mt-8 text-center text-gray-500">
            And many more areas! Contact us if your area is not listed.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Book your first pickup today and enjoy 20% off with code WELCOME20
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking">
              <Button size="xl" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50">
                Book Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="tel:+923001234567">
              <Button size="xl" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                <Phone className="mr-2 h-5 w-5" />
                Call Us
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
