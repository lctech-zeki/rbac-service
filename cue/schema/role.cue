// CUE schema: Role entity
// Keep in sync with packages/shared/src/index.ts → RoleSchema

package schema

#Role: {
	id:          string & =~"^[0-9a-f-]{36}$"
	name:        string & len >= 2 & len <= 100
	description: string | null
	createdAt:   string
	updatedAt:   string
}

#CreateRole: {
	name:         string & len >= 2 & len <= 100
	description?: string & len <= 500
}
