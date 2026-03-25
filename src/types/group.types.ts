export interface GroupUser {
  user: string
  device?: string
  memo?: string
  status?: number
  disabled?: boolean
}

export interface GroupInfo {
  status: number
  request: string
  name: string
  users: GroupUser[]
}

export interface AddUserOptions {
  user: string
  device?: string
  memo?: string
}

export interface GroupActionResponse {
  status: number
  request: string
  errors?: string[]
}
