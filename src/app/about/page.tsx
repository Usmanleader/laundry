import { Metadata } from 'next'
import Link from 'next/link'
import { Users, Leaf, Award, Heart, Target, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Washerman Karachi - Our mission, values, and commitment to quality laundry services.',
}

const stats = [
  { value: '10,000+', label: 'Happy Customers' },
  { value: '50,000+', label: 'Orders Completed' },
  { value: '20+', label: 'Areas Covered' },
  { value: '4.9', label: 'Customer Rating' },
]

const values = [
  {
    icon: Award,
    title: 'Quality First',
    description: 'We never compromise on quality. Every garment is treated with the utmost care and attention.',
  },
  {
    icon: Clock,
    title: 'Reliable Service',
    description: 'Timely pickup and delivery, every time. We respect your schedule and stick to our commitments.',
  },
  {
    icon: Leaf,
    title: 'Eco-Friendly',
    description: 'We use environmentally friendly detergents and practices to minimize our carbon footprint.',
  },
  {
    icon: Heart,
    title: 'Customer Care',
    description: 'Your satisfaction is our priority. We go above and beyond to ensure you are happy with our service.',
  },
  {
    icon: Target,
    title: 'Transparency',
    description: 'No hidden fees, no surprises. What you see is what you pay. Simple and honest pricing.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'We are proud to serve Karachi and support local employment through our operations.',
  },
]

const team = [
  {
    name: 'Ahmed Hassan',
    role: 'Founder & CEO',
    bio: 'Started Washerman with a vision to make quality laundry accessible to everyone in Karachi.',
  },
  {
    name: 'Fatima Khan',
    role: 'Operations Head',
    bio: 'Ensures every order meets our high quality standards before delivery.',
  },
  {
    name: 'Ali Raza',
    role: 'Customer Success',
    bio: 'Dedicated to making sure every customer has a great experience.',
  },
]

const timeline = [
  { year: '2020', title: 'The Beginning', description: 'Started with a small facility in DHA Phase 6' },
  { year: '2021', title: 'Expansion', description: 'Expanded to cover all major areas of Karachi' },
  { year: '2022', title: 'Tech Upgrade', description: 'Launched online booking and real-time tracking' },
  { year: '2023', title: 'Premium Services', description: 'Introduced premium laundry and express services' },
  { year: '2024', title: 'Growing Strong', description: 'Serving 10,000+ happy customers across Karachi' },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">About Washerman</h1>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            Making quality laundry services accessible to everyone in Karachi since 2020.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600">{stat.value}</div>
                <div className="mt-1 text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Our Story</h2>
              <div className="mt-6 space-y-4 text-gray-600">
                <p>
                  Washerman Karachi was born out of a simple observation: busy professionals and families 
                  in Karachi needed a reliable, quality laundry service that respects their time and their clothes.
                </p>
                <p>
                  What started as a small operation in DHA Phase 6 in 2020 has grown into Karachi&apos;s most 
                  trusted laundry service. We now serve over 10,000 customers across 20+ areas, processing 
                  thousands of garments every week.
                </p>
                <p>
                  Our commitment to quality, reliability, and customer satisfaction has made us the preferred 
                  choice for families, professionals, and businesses throughout the city.
                </p>
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Our Journey</h3>
              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-16 text-sm font-bold text-blue-600">{item.year}</div>
                    <div>
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
            <p className="mt-4 text-gray-600">What drives us every day</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <value.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{value.title}</h3>
                  <p className="mt-2 text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Meet Our Team</h2>
            <p className="mt-4 text-gray-600">The people behind Washerman</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white text-3xl font-bold">
                  {member.name.charAt(0)}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-blue-600">{member.role}</p>
                <p className="mt-2 text-sm text-gray-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Join Our Growing Family</h2>
          <p className="mt-4 text-xl text-blue-100">
            Experience the Washerman difference for yourself
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking">
              <Button size="xl" className="bg-white text-blue-600 hover:bg-blue-50">
                Book Your First Pickup
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="xl" variant="outline" className="border-white text-white hover:bg-white/10">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
