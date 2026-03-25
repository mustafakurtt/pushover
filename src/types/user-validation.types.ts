export interface UserValidationRequest {
  user: string
  device?: string
}

export interface UserValidationResponse {
  status: number
  request: string
  group: 0 | 1
  devices: string[]
  licenses: string[]
  errors?: string[]
}
