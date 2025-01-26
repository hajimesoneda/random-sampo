export interface User {
  id: string
  email: string
  password: string // This will be hashed
}

export interface UserWithoutPassword {
  id: string
  email: string
}

