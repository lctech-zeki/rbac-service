import { z } from 'zod'

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
})
export type RegisterDto = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type LoginDto = z.infer<typeof LoginSchema>

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>

export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
})
export type TokenResponse = z.infer<typeof TokenResponseSchema>

// ─── User ─────────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type User = z.infer<typeof UserSchema>

export const CreateUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
})
export type CreateUserDto = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(50).optional(),
})
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
})
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>

// ─── Role ─────────────────────────────────────────────────────────────────────

export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Role = z.infer<typeof RoleSchema>

export const CreateRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
})
export type CreateRoleDto = z.infer<typeof CreateRoleSchema>

export const UpdateRoleSchema = CreateRoleSchema.partial()
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>

export const SetRoleParentSchema = z.object({
  parentId: z.string().uuid(),
})
export type SetRoleParentDto = z.infer<typeof SetRoleParentSchema>

// ─── Permission ───────────────────────────────────────────────────────────────

export const PermissionSchema = z.object({
  id: z.string().uuid(),
  resource: z.string(),
  action: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
})
export type Permission = z.infer<typeof PermissionSchema>

export const CreatePermissionSchema = z.object({
  resource: z.string().min(1).max(100),
  action: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})
export type CreatePermissionDto = z.infer<typeof CreatePermissionSchema>

export const UpdatePermissionSchema = z.object({
  description: z.string().max(500).optional(),
})
export type UpdatePermissionDto = z.infer<typeof UpdatePermissionSchema>

// ─── Authorization ────────────────────────────────────────────────────────────

export const CheckPermissionSchema = z.object({
  userId: z.string().uuid(),
  resource: z.string().min(1),
  action: z.string().min(1),
})
export type CheckPermissionDto = z.infer<typeof CheckPermissionSchema>

export const CheckPermissionResponseSchema = z.object({
  allowed: z.boolean(),
  userId: z.string().uuid(),
  resource: z.string(),
  action: z.string(),
})
export type CheckPermissionResponse = z.infer<typeof CheckPermissionResponseSchema>

// ─── Assignment ───────────────────────────────────────────────────────────────

export const AssignRoleSchema = z.object({
  roleId: z.string().uuid(),
})
export type AssignRoleDto = z.infer<typeof AssignRoleSchema>

export const AssignPermissionSchema = z.object({
  permissionId: z.string().uuid(),
})
export type AssignPermissionDto = z.infer<typeof AssignPermissionSchema>

// ─── Permission Group ─────────────────────────────────────────────────────────

export const PermissionGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type PermissionGroup = z.infer<typeof PermissionGroupSchema>

export const CreatePermissionGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
})
export type CreatePermissionGroupDto = z.infer<typeof CreatePermissionGroupSchema>

export const UpdatePermissionGroupSchema = CreatePermissionGroupSchema.partial()
export type UpdatePermissionGroupDto = z.infer<typeof UpdatePermissionGroupSchema>

export const AssignPermissionGroupSchema = z.object({
  groupId: z.string().uuid(),
})
export type AssignPermissionGroupDto = z.infer<typeof AssignPermissionGroupSchema>

// ─── API Envelope ─────────────────────────────────────────────────────────────

export type ApiResponse<T> = {
  data: T
  meta?: PaginationMeta
}

export type ApiError = {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
}
