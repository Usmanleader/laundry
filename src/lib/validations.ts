import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string()
    .regex(/^(\+92|0)?3[0-9]{9}$/, 'Please enter a valid Pakistani phone number'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string()
    .regex(/^(\+92|0)?3[0-9]{9}$/, 'Please enter a valid Pakistani phone number'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

export const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  area: z.string().min(1, 'Area is required'),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  isPrimary: z.boolean().optional(),
})

export const bookingSchema = z.object({
  pickupAddressId: z.string().uuid('Please select a pickup address'),
  deliveryAddressId: z.string().uuid('Please select a delivery address'),
  preferredPickupDate: z.string().min(1, 'Please select a pickup date'),
  preferredPickupTime: z.string().min(1, 'Please select a pickup time'),
  preferredDeliveryDate: z.string().min(1, 'Please select a delivery date'),
  preferredDeliveryTime: z.string().min(1, 'Please select a delivery time'),
  services: z.array(z.object({
    serviceId: z.string().uuid(),
    quantity: z.number().min(1),
    weightKg: z.number().min(0.5).optional(),
    notes: z.string().optional(),
  })).min(1, 'Please select at least one service'),
  specialInstructions: z.string().optional(),
  promotionCode: z.string().optional(),
  isUrgent: z.boolean().default(false),
  paymentMethod: z.enum(['cod', 'card', 'wallet']).default('cod'),
})

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  driverRating: z.number().min(1).max(5).optional(),
  driverComment: z.string().optional(),
})

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export const promotionSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(1, 'Discount value must be positive'),
  minOrderAmount: z.number().optional(),
  maxDiscountAmount: z.number().optional(),
  validFrom: z.string(),
  validUntil: z.string(),
  usageLimit: z.number().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type BookingInput = z.infer<typeof bookingSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type ContactInput = z.infer<typeof contactSchema>
export type PromotionInput = z.infer<typeof promotionSchema>
