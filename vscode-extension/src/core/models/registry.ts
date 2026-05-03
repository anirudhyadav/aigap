export interface RegistryCounters {
  GP: number
  GC: number
  EV: number
  FR: number
  TASK: number
}

export interface Registry {
  counters: RegistryCounters
  lastUpdated: string
}
