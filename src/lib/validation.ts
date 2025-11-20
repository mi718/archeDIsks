import { z } from 'zod'

export const timeUnitSchema = z.enum(['month', 'week', 'day', 'quarter'])
export const viewModeSchema = z.enum(['disc', 'calendar', 'list'])
export const ringTypeSchema = z.enum(['normal', 'thin'])
export const recurrenceRuleSchema = z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly'])

export const labelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Label name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
})

export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Attachment name is required'),
  url: z.string().url('Invalid URL'),
})

export const recurrenceSchema = z.object({
  rule: recurrenceRuleSchema,
  interval: z.number().min(1).optional(),
  count: z.number().min(1).optional(),
  until: z.string().datetime().optional(),
})

export const activitySchema = z.object({
  id: z.string(),
  ringId: z.string().min(1, 'Ring is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start: z.string().datetime('Invalid start date'),
  end: z.string().datetime('Invalid end date').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  labelIds: z.array(z.string()).optional(),
  attachments: z.array(attachmentSchema).optional(),
  recurrence: recurrenceSchema.optional(),
})

export const ringSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Ring name is required'),
  type: ringTypeSchema,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  timeUnit: timeUnitSchema.optional(),
  readOnly: z.boolean().optional(),
})

export const discThemeSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  bg: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
})

export const discSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Disc name is required'),
  start: z.string().datetime('Invalid start date'),
  end: z.string().datetime('Invalid end date'),
  defaultTimeUnit: timeUnitSchema,
  rings: z.array(ringSchema),
  labels: z.array(labelSchema),
  theme: discThemeSchema.optional(),
  version: z.number().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Form validation schemas
export const activityFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Invalid start date'),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Invalid end date').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  labelIds: z.array(z.string()).optional(),
  recurrence: recurrenceSchema.optional(),
})

export const ringFormSchema = z.object({
  name: z.string().min(1, 'Ring name is required'),
  type: ringTypeSchema,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  timeUnit: timeUnitSchema.optional(),
})

export const discFormSchema = z.object({
  name: z.string().min(1, 'Disc name is required'),
  start: z.string().datetime('Invalid start date'),
  end: z.string().datetime('Invalid end date'),
  defaultTimeUnit: timeUnitSchema,
  theme: discThemeSchema.optional(),
})

export const labelFormSchema = z.object({
  name: z.string().min(1, 'Label name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
})

// Type inference from schemas
export type ActivityFormData = z.infer<typeof activityFormSchema>
export type RingFormData = z.infer<typeof ringFormSchema>
export type DiscFormData = z.infer<typeof discFormSchema>
export type LabelFormData = z.infer<typeof labelFormSchema>
