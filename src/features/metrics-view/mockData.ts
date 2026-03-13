export interface SensorTrend {
  time: string
  value: number
}

export interface MetricData {
  value: number | string
  unit: string
  trend: SensorTrend[]
  change: number | string // percentage or text
  status: 'good' | 'warning' | 'danger'
}

export interface ZoneHealth {
  healthy: number
  warning: number
  danger: number
}

export interface ZoneMetrics {
  id: string
  name: string
  health: ZoneHealth
  sensors: {
    temperature: MetricData
    humidity: MetricData
    soil: MetricData
    light: MetricData
  }
}

export const MOCK_ZONES_DATA: Record<string, ZoneMetrics> = {
  A: {
    id: 'A',
    name: 'Khu A',
    health: { healthy: 85, warning: 10, danger: 5 },
    sensors: {
      temperature: {
        value: 28.5, unit: '°C', change: 1.2, status: 'good',
        trend: [{ time: '08:00', value: 20 }, { time: '09:00', value: 19 }, { time: '10:00', value: 22 }, { time: '11:00', value: 25 }, { time: '12:00', value: 28.5 }]
      },
      humidity: {
        value: 72, unit: '%', change: -0.5, status: 'good',
        trend: [{ time: '08:00', value: 75 }, { time: '09:00', value: 73 }, { time: '10:00', value: 74 }, { time: '11:00', value: 73 }, { time: '12:00', value: 72 }]
      },
      soil: {
        value: 45, unit: '%', change: 2.4, status: 'good',
        trend: [{ time: '08:00', value: 38 }, { time: '09:00', value: 40 }, { time: '10:00', value: 42 }, { time: '11:00', value: 44 }, { time: '12:00', value: 45 }]
      },
      light: {
        value: '12,000', unit: 'Lux', change: 'Ổn định', status: 'good',
        trend: [{ time: '08:00', value: 11000 }, { time: '09:00', value: 11500 }, { time: '10:00', value: 12000 }, { time: '11:00', value: 11800 }, { time: '12:00', value: 12000 }]
      }
    }
  },
  B: {
    id: 'B',
    name: 'Khu B',
    health: { healthy: 60, warning: 30, danger: 10 },
    sensors: {
      temperature: {
        value: 29.1, unit: '°C', change: 3.5, status: 'warning',
        trend: [{ time: '08:00', value: 26 }, { time: '09:00', value: 27 }, { time: '10:00', value: 28 }, { time: '11:00', value: 28.5 }, { time: '12:00', value: 29.1 }]
      },
      humidity: {
        value: 45, unit: '%', change: -5.0, status: 'warning',
        trend: [{ time: '08:00', value: 55 }, { time: '09:00', value: 50 }, { time: '10:00', value: 48 }, { time: '11:00', value: 46 }, { time: '12:00', value: 45 }]
      },
      soil: {
        value: 18, unit: '%', change: -4.2, status: 'danger',
        trend: [{ time: '08:00', value: 25 }, { time: '09:00', value: 22 }, { time: '10:00', value: 20 }, { time: '11:00', value: 19 }, { time: '12:00', value: 18 }]
      },
      light: {
        value: 52000, unit: 'Lux', change: 12.0, status: 'warning',
        trend: [{ time: '08:00', value: 35000 }, { time: '09:00', value: 42000 }, { time: '10:00', value: 48000 }, { time: '11:00', value: 50000 }, { time: '12:00', value: 52000 }]
      }
    }
  },
  C: {
    id: 'C',
    name: 'Khu C',
    health: { healthy: 92, warning: 5, danger: 3 },
    sensors: {
      temperature: {
        value: 23.2, unit: '°C', change: -0.5, status: 'good',
        trend: [{ time: '08:00', value: 24 }, { time: '09:00', value: 23.8 }, { time: '10:00', value: 23.5 }, { time: '11:00', value: 23.3 }, { time: '12:00', value: 23.2 }]
      },
      humidity: {
        value: 70, unit: '%', change: 1.0, status: 'good',
        trend: [{ time: '08:00', value: 68 }, { time: '09:00', value: 69 }, { time: '10:00', value: 69.5 }, { time: '11:00', value: 70 }, { time: '12:00', value: 70 }]
      },
      soil: {
        value: 55, unit: '%', change: 2.1, status: 'good',
        trend: [{ time: '08:00', value: 50 }, { time: '09:00', value: 52 }, { time: '10:00', value: 53 }, { time: '11:00', value: 54 }, { time: '12:00', value: 55 }]
      },
      light: {
        value: 41000, unit: 'Lux', change: -2.0, status: 'good',
        trend: [{ time: '08:00', value: 45000 }, { time: '09:00', value: 44000 }, { time: '10:00', value: 42000 }, { time: '11:00', value: 41500 }, { time: '12:00', value: 41000 }]
      }
    }
  }
}
