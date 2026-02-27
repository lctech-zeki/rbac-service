// CUE schema: User entity
// Keep in sync with packages/shared/src/index.ts → UserSchema

package schema

#User: {
	id:        string & =~"^[0-9a-f-]{36}$"  // UUID v4
	email:     string & =~"^[^@]+@[^@]+$"
	username:  string & len >= 3 & len <= 50
	isActive:  bool
	createdAt: string
	updatedAt: string
}

#CreateUser: {
	email:    string & =~"^[^@]+@[^@]+$"
	username: string & len >= 3 & len <= 50
	password: string & len >= 8 & len <= 100
}

#UpdateUser: {
	email?:    string & =~"^[^@]+@[^@]+$"
	username?: string & len >= 3 & len <= 50
}
