'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock, Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { contactSchema, ContactInput } from '@/lib/validations'

const contactInfo = [
  {
    icon: Phone,
    title: 'Phone',
    details: ['+92 300 123 4567', '+92 21 1234 5678'],
    action: 'tel:+923001234567',
  },
  {
    icon: Mail,
    title: 'Email',
    details: ['hello@washerman.pk', 'support@washerman.pk'],
    action: 'mailto:hello@washerman.pk',
  },
  {
    icon: MapPin,
    title: 'Head Office',
    details: ['Block 7, Clifton', 'Karachi, Pakistan'],
  },
  {
    icon: Clock,
    title: 'Working Hours',
    details: ['Mon - Sat: 8 AM - 10 PM', 'Sunday: 9 AM - 8 PM'],
  },
]

const subjects = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'booking', label: 'Booking Issue' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'partnership', label: 'Business Partnership' },
  { value: 'careers', label: 'Careers' },
]

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactInput) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log('Contact form data:', data)
      toast('success', 'Message Sent!', 'We will get back to you within 24 hours.')
      reset()
    } catch (error) {
      toast('error', 'Error', 'Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Contact Us</h1>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            Have questions? We&apos;re here to help. Reach out to us anytime.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <info.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">{info.title}</h3>
                  {info.details.map((detail, i) => (
                    info.action ? (
                      <a
                        key={i}
                        href={info.action}
                        className="block mt-1 text-sm text-gray-600 hover:text-blue-600"
                      >
                        {detail}
                      </a>
                    ) : (
                      <p key={i} className="mt-1 text-sm text-gray-600">{detail}</p>
                    )
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Send us a Message</h2>
              </div>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </p>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <Input
                    label="Your Name"
                    placeholder="Ahmed Khan"
                    error={errors.name?.message}
                    {...register('name')}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="ahmed@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <Input
                    label="Phone Number (Optional)"
                    placeholder="+92 300 1234567"
                    {...register('phone')}
                  />
                  <Select
                    label="Subject"
                    options={subjects}
                    placeholder="Select a subject"
                    error={errors.subject?.message}
                    {...register('subject')}
                  />
                </div>
                
                <Textarea
                  label="Your Message"
                  placeholder="How can we help you?"
                  rows={5}
                  error={errors.message?.message}
                  {...register('message')}
                />
                
                <Button type="submit" size="lg" isLoading={isLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>
            
            {/* Map Placeholder */}
            <div className="bg-gray-200 rounded-2xl overflow-hidden min-h-[400px] flex items-center justify-center">
              <div className="text-center p-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Map integration coming soon!
                  <br />
                  <span className="text-sm">Block 7, Clifton, Karachi</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="py-12 bg-green-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white">Prefer WhatsApp?</h2>
          <p className="mt-2 text-green-100">
            Chat with us directly for quick responses
          </p>
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </div>
  )
}
