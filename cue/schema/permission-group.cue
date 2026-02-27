// CUE schema: PermissionGroup entity
// Keep in sync with packages/shared/src/index.ts → PermissionGroupSchema

package schema

#PermissionGroup: {
	id:          string & =~"^[0-9a-f-]{36}$"
	name:        string & len >= 2 & len <= 100
	description: string | null
	createdAt:   string
	updatedAt:   string
}

#CreatePermissionGroup: {
	name:         string & len >= 2 & len <= 100
	description?: string & len <= 500
}
