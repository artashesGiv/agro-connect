import { OtherUserMarker } from '../types';

const DEFAULT_REGION_LAT = 55.7558;
const DEFAULT_REGION_LNG = 37.6173;

export const otherUsersSeed: OtherUserMarker[] = [
  {
    id: 'mock-1',
    ownerId: 'user-mock-1',
    ownerLabel: 'Иван Петров',
    coordinate: {
      latitude: DEFAULT_REGION_LAT + 0.01,
      longitude: DEFAULT_REGION_LNG + 0.01,
    },
    title: 'Поле пшеницы',
  },
  {
    id: 'mock-2',
    ownerId: 'user-mock-2',
    ownerLabel: 'Мария Сидорова',
    coordinate: {
      latitude: DEFAULT_REGION_LAT - 0.01,
      longitude: DEFAULT_REGION_LNG - 0.01,
    },
    title: 'Посадка подсолнечника',
  },
  {
    id: 'mock-3',
    ownerId: 'user-mock-3',
    ownerLabel: 'Дмитрий Иванов',
    coordinate: {
      latitude: DEFAULT_REGION_LAT + 0.005,
      longitude: DEFAULT_REGION_LNG - 0.015,
    },
    title: 'Пасека',
  },
  {
    id: 'mock-4',
    ownerId: 'user-mock-1',
    ownerLabel: 'Иван Петров',
    coordinate: {
      latitude: DEFAULT_REGION_LAT - 0.005,
      longitude: DEFAULT_REGION_LNG + 0.02,
    },
    title: 'Овощное поле',
  },
];
