import type { PlantEventType } from '../../shared/types';

export const ALL_EVENT_TYPES: PlantEventType[] = [
  'IRRIGATION',
  'NUTRITION',
  'WEED_CONTROL',
  'PRUNING',
  'SCOUTING',
  'DISEASE_DETECTED',
  'TREATMENT_APPLICATION',
  'QUARANTINE',
  'HEALTH_RECOVERY',
  'PHENOLOGY',
  'REPOT',
  'HARVEST',
  'ALERT_TRIGGERED',
];

export const EVENT_TYPE_OPTIONS: [PlantEventType, string][] = [
  ['IRRIGATION',           'Tưới nước'],
  ['NUTRITION',            'Dinh dưỡng'],
  ['WEED_CONTROL',         'Kiểm soát cỏ dại'],
  ['PRUNING',              'Tỉa cành'],
  ['SCOUTING',             'Khảo sát'],
  ['DISEASE_DETECTED',     'Phát hiện bệnh'],
  ['TREATMENT_APPLICATION','Ứng dụng điều trị'],
  ['QUARANTINE',           'Cách ly'],
  ['HEALTH_RECOVERY',      'Phục hồi sức khỏe'],
  ['PHENOLOGY',            'Hiện tượng sinh trưởng'],
  ['REPOT',                'Thay chậu'],
  ['HARVEST',              'Thu hoạch'],
  ['ALERT_TRIGGERED',      'Cảnh báo'],
];

export const SCOPE_OPTIONS: [string, string][] = [
  ['FARM',       'Vườn (Farm)'],
  ['FARM_ZONE',  'Khu vực (Farm Zone)'],
  ['PLANT',      'Cây (Plant)'],
];
