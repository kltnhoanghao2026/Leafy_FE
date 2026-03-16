export interface FarmInfo {
  name: string
  location: string
  area: string
}

export interface Zone {
  id: string
  name: string
  variety: string
  area: string
  status: 'ĐANG TRỒNG' | 'ĐANG CẢI TẠO'
}

export interface Sensor {
  id: string
  name: string
  status: 'online' | 'offline'
  battery: number // 0-100 percentage
  lastSignal: string
  zoneId?: string
}

export const MOCK_DEVICES_DATA = {
  farmInfo: {
    name: 'Nông trại Cầu Đất',
    location: 'Trạm Hành, Đà Lạt, Lâm Đồng',
    area: '5.2 ha'
  } as FarmInfo,
  
  zones: [
    { id: 'A', name: 'Khu A', variety: 'Arabica Typica', area: '2.0 ha', status: 'ĐANG TRỒNG' },
    { id: 'B', name: 'Khu B', variety: 'Arabica Bourbon', area: '1.5 ha', status: 'ĐANG TRỒNG' },
    { id: 'C', name: 'Khu C', variety: 'Chưa xác định', area: '1.7 ha', status: 'ĐANG CẢI TẠO' },
  ] as Zone[],

  sensors: [
    { id: 'S01', name: 'Module cảm biến A1', status: 'online', battery: 85, lastSignal: 'Vài giây trước', zoneId: 'A' },
    { id: 'S02', name: 'Module cảm biến A2', status: 'online', battery: 42, lastSignal: '15 phút trước', zoneId: 'B' },
    { id: 'S03', name: 'Module cảm biến B1', status: 'offline', battery: 0, lastSignal: '2 ngày trước', zoneId: 'C' },
  ] as Sensor[]
}
