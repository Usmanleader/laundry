'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Phone, Calendar, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { profileSchema, ProfileInput } from '@/lib/validations'
import type { Profile } from '@/types/database'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setEmail(user.email || '')

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as { data: Profile | null }

      if (profileData) {
        setProfile(profileData)
        setValue('fullName', profileData.full_name || '')
        setValue('phone', profileData.phone || '')
        setValue('dateOfBirth', profileData.date_of_birth || '')
        setValue('gender', (profileData.gender as 'male' | 'female' | 'other') || undefined)
      }
      setIsLoading(false)
    }

    fetchProfile()
  }, [supabase, router, setValue])

  const onSubmit = async (data: ProfileInput) => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone,
          date_of_birth: data.dateOfBirth || null,
          gender: data.gender || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      toast('success', 'Profile Updated', 'Your profile has been updated successfully.')
    } catch (error) {
      toast('error', 'Error', 'Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-600">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500 text-white text-2xl font-bold">
                {profile?.full_name?.charAt(0) || email.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle>{profile?.full_name || 'User'}</CardTitle>
                <CardDescription>{email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <Input
                  label="Full Name"
                  placeholder="Ahmed Khan"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
                <User className="absolute right-3 top-8 h-5 w-5 text-slate-400" />
              </div>
              
              <div className="relative">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  disabled
                  className="bg-slate-50"
                />
                <Mail className="absolute right-3 top-8 h-5 w-5 text-slate-400" />
              </div>
              
              <div className="relative">
                <Input
                  label="Phone Number"
                  placeholder="+92 300 1234567"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                <Phone className="absolute right-3 top-8 h-5 w-5 text-slate-400" />
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="Date of Birth"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                  <Calendar className="absolute right-3 top-8 h-5 w-5 text-slate-400" />
                </div>
                
                <Select
                  label="Gender"
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  placeholder="Select gender"
                  {...register('gender')}
                />
              </div>
              
              <div className="pt-4">
                <Button type="submit" isLoading={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible and destructive actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled>
              Delete Account
            </Button>
            <p className="text-sm text-slate-500 mt-2">
              Contact support to delete your account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
