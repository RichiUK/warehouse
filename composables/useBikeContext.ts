export interface GuardianReport {
  id: string
  text: string
  severity: 'low' | 'medium' | 'high'
  guardianName: string
  timestamp: string
}

export interface BikeContext {
  iotStatus: 'online' | 'offline'
  batteryLevel: number
  guardianReports: GuardianReport[]
}

// Deterministic pseudo-hash so same bikeId always gives same data
function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) & 0xffff
  }
  return h
}

const GUARDIAN_REPORTS_POOL: GuardianReport[] = [
  { id: 'g1', text: 'Front brake not responding', severity: 'high', guardianName: 'Forest Guardian', timestamp: '2h ago' },
  { id: 'g2', text: 'Bell missing', severity: 'low', guardianName: 'Forest Guardian', timestamp: '5h ago' },
  { id: 'g3', text: 'Handlebar wobble reported by last rider', severity: 'medium', guardianName: 'Forest Guardian', timestamp: '1h ago' },
  { id: 'g4', text: 'Rear light not working', severity: 'medium', guardianName: 'Forest Guardian', timestamp: '3h ago' },
  { id: 'g5', text: 'Chain making noise when pedalling', severity: 'low', guardianName: 'Forest Guardian', timestamp: '4h ago' },
  { id: 'g6', text: 'Saddle very low / broken clamp', severity: 'medium', guardianName: 'Forest Guardian', timestamp: '6h ago' },
  { id: 'g7', text: 'Basket detached / loose', severity: 'high', guardianName: 'Forest Guardian', timestamp: '30m ago' },
  { id: 'g8', text: 'IoT disconnection event logged', severity: 'low', guardianName: 'Forest Guardian', timestamp: '8h ago' },
  { id: 'g9', text: 'Rear reflector missing', severity: 'low', guardianName: 'Forest Guardian', timestamp: '7h ago' },
  { id: 'g10', text: 'Brakes squealing under light pressure', severity: 'medium', guardianName: 'Forest Guardian', timestamp: '2h ago' },
]

export function useBikeContext(bikeId: string): BikeContext {
  const h = hashId(bikeId)
  // ~20% chance offline
  const iotStatus: 'online' | 'offline' = h % 5 === 0 ? 'offline' : 'online'
  // Battery 8 – 97%
  const batteryLevel = 8 + (h % 90)
  // 0–3 reports (some bikes have none)
  const reportCount = h % 4
  const startIdx = h % GUARDIAN_REPORTS_POOL.length
  const guardianReports = Array.from({ length: reportCount }, (_, i) =>
    GUARDIAN_REPORTS_POOL[(startIdx + i) % GUARDIAN_REPORTS_POOL.length],
  )
  return { iotStatus, batteryLevel, guardianReports }
}
