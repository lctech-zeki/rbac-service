// CUE schema: Permission entity
// Keep in sync with packages/shared/src/index.ts → PermissionSchema

package schema

#Permission: {
	id:          string & =~"^[0-9a-f-]{36}$"
	resource:    string & len >= 1 & len <= 100
	action:      string & len >= 1 & len <= 100
	description: string | null
	createdAt:   string
}

// Known resources and actions for documentation / IDE completion
#Resource: "users" | "roles" | "permissions" | "authz"
#Action:   "create" | "read" | "update" | "delete" | "assign"

#CreatePermission: {
	resource:     #Resource | string
	action:       #Action | string
	description?: string & len <= 500
}
