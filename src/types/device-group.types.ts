export interface DeviceGroupMap {
  [groupName: string]: string[]
}

export interface MultiDeviceResult {
  device: string
  success: boolean
  response?: import('./response.types.ts').PushoverResponse
  error?: Error
}
