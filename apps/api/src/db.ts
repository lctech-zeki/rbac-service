import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  pgTable, uuid, varchar, text, timestamp, boolean, primaryKey, uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { env } from './env'

// ─── Schema ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (t) => [uniqueIndex('users_email_idx').on(t.email)])

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [uniqueIndex('roles_name_idx').on(t.name)])

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  resource: varchar('resource', { length: 100 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [uniqueIndex('permissions_resource_action_idx').on(t.resource, t.action)])

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.roleId] })])

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })])

// ─── Permission Groups ────────────────────────────────────────────────────────

export const permissionGroups = pgTable('permission_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [uniqueIndex('permission_groups_name_idx').on(t.name)])

export const permissionGroupItems = pgTable('permission_group_items', {
  groupId: uuid('group_id').notNull().references(() => permissionGroups.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.groupId, t.permissionId] })])

export const rolePermissionGroups = pgTable('role_permission_groups', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  groupId: uuid('group_id').notNull().references(() => permissionGroups.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.roleId, t.groupId] })])

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}))
export const rolesRelations = relations(roles, ({ one, many }) => ({
  parent: one(roles, { fields: [roles.parentId], references: [roles.id], relationName: 'role_children' }),
  children: many(roles, { relationName: 'role_children' }),
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
  rolePermissionGroups: many(rolePermissionGroups),
}))
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  permissionGroupItems: many(permissionGroupItems),
}))
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}))
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}))
export const permissionGroupsRelations = relations(permissionGroups, ({ many }) => ({
  permissionGroupItems: many(permissionGroupItems),
  rolePermissionGroups: many(rolePermissionGroups),
}))
export const permissionGroupItemsRelations = relations(permissionGroupItems, ({ one }) => ({
  group: one(permissionGroups, { fields: [permissionGroupItems.groupId], references: [permissionGroups.id] }),
  permission: one(permissions, { fields: [permissionGroupItems.permissionId], references: [permissions.id] }),
}))
export const rolePermissionGroupsRelations = relations(rolePermissionGroups, ({ one }) => ({
  role: one(roles, { fields: [rolePermissionGroups.roleId], references: [roles.id] }),
  group: one(permissionGroups, { fields: [rolePermissionGroups.groupId], references: [permissionGroups.id] }),
}))

// ─── Client ───────────────────────────────────────────────────────────────────

const client = postgres(env.DATABASE_URL)
export const db = drizzle(client, {
  schema: {
    users, roles, permissions, userRoles, rolePermissions,
    permissionGroups, permissionGroupItems, rolePermissionGroups,
  },
})
