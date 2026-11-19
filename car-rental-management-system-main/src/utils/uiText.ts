import type { BookingStatus, FuelType, TransmissionType, UserRole } from '../types';

const bookingStatusLabels: Record<BookingStatus, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const transmissionLabels: Record<TransmissionType, string> = {
  automatic: 'Otomatis',
  manual: 'Manual',
};

const fuelTypeLabels: Record<FuelType, string> = {
  petrol: 'Bensin',
  diesel: 'Diesel',
  hybrid: 'Hibrida',
  electric: 'Listrik',
};

export const getBookingStatusLabel = (status: BookingStatus): string =>
  bookingStatusLabels[status];

export const getTransmissionLabel = (transmission: TransmissionType): string =>
  transmissionLabels[transmission];

export const getFuelTypeLabel = (fuelType: FuelType): string =>
  fuelTypeLabels[fuelType];

export const getUserRoleLabel = (role: UserRole): string =>
  role === 'admin' ? 'Administrator' : 'Pelanggan';

export const getCategoryLabel = (category: string): string => {
  const normalized = category.trim().toLowerCase();
  const labels: Record<string, string> = {
    'city car': 'Mobil kota',
    sedan: 'Sedan',
    suv: 'SUV',
    mpv: 'MPV',
    luxury: 'Mewah',
    'luxury car': 'Mobil mewah',
  };

  return labels[normalized] || category;
};
