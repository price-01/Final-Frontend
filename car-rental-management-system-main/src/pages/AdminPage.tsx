import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks';
import {
  getCars,
  addCar,
  updateCar,
  deleteCar,
  insertSampleCars,
} from '../services/carService';
import {
  getAllBookings,
  updateBookingStatus,
} from '../services/bookingService';
import { LoadingSpinner } from '../components';
import type {
  Car,
  CarInput,
  TransmissionType,
  FuelType,
  Booking,
  BookingStatus,
} from '../types';
import { formatIDR } from '../utils/formatters';
import {
  getBookingStatusLabel,
  getCategoryLabel,
  getFuelTypeLabel,
  getTransmissionLabel,
} from '../utils/uiText';

interface CarFormState {
  brand: string;
  model: string;
  year: string;
  pricePerDay: string;
  seats: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  category: string;
  imageUrl: string;
  description: string;
  available: boolean;
}

const INITIAL_FORM_STATE: CarFormState = {
  brand: '',
  model: '',
  year: new Date().getFullYear().toString(),
  pricePerDay: '',
  seats: '5',
  transmission: 'automatic',
  fuelType: 'petrol',
  category: 'city car',
  imageUrl: '',
  description: '',
  available: true,
};

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'fleet' | 'bookings'>('fleet');

  // Cars Fleet State
  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [carsError, setCarsError] = useState<string | null>(null);

  // Bookings State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  // Notifications
  const [notice, setNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modal State for Add / Edit Car
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState<CarFormState>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for Delete Car Confirmation
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sample data loading state
  const [isAddingSample, setIsAddingSample] = useState(false);

  // Fetch Cars Fleet
  const fetchFleet = useCallback(async () => {
    setCarsLoading(true);
    try {
      const data = await getCars();
      setCars(data);
      setCarsError(null);
    } catch (err) {
      console.error('Gagal memuat mobil:', err);
      setCarsError('Gagal memuat daftar mobil.');
    } finally {
      setCarsLoading(false);
    }
  }, []);

  // Fetch All Bookings
  const fetchBookingsList = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const data = await getAllBookings();
      setBookings(data);
      setBookingsError(null);
    } catch (err) {
      console.error('Gagal memuat pesanan:', err);
      setBookingsError('Gagal memuat daftar pesanan.');
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchFleet();
      fetchBookingsList();
    }
  }, [isAdmin, fetchFleet, fetchBookingsList]);

  // Car Form actions
  const handleOpenAdd = () => {
    setEditingCar(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (car: Car) => {
    setEditingCar(car);
    setFormData({
      brand: car.brand,
      model: car.model,
      year: car.year.toString(),
      pricePerDay: car.pricePerDay.toString(),
      seats: car.seats.toString(),
      transmission: car.transmission,
      fuelType: car.fuelType,
      category: car.category,
      imageUrl: car.imageUrl,
      description: car.description,
      available: car.available,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCar(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const brand = formData.brand.trim();
    const model = formData.model.trim();
    const yearNum = parseInt(formData.year, 10);
    const priceNum = parseFloat(formData.pricePerDay);
    const seatsNum = parseInt(formData.seats, 10);
    const category = formData.category.trim();
    const imageUrl = formData.imageUrl.trim();
    const description = formData.description.trim();

    if (!brand) {
      setFormError('Merek kendaraan wajib diisi.');
      return;
    }
    if (!model) {
      setFormError('Model kendaraan wajib diisi.');
      return;
    }
    if (isNaN(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 2) {
      setFormError(`Masukkan tahun produksi yang valid (1990–${new Date().getFullYear() + 2}).`);
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Harga per hari harus berupa angka positif yang valid dalam rupiah.');
      return;
    }
    if (isNaN(seatsNum) || seatsNum < 1 || seatsNum > 30) {
      setFormError('Jumlah kursi harus berupa angka antara 1 dan 30.');
      return;
    }
    if (!category) {
      setFormError('Kategori kendaraan wajib diisi (misalnya mobil kota, SUV, MPV).');
      return;
    }
    if (!imageUrl) {
      setFormError('URL gambar wajib diisi.');
      return;
    }
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      setFormError('URL gambar harus diawali dengan http:// atau https://.');
      return;
    }
    if (!description) {
      setFormError('Silakan isi deskripsi singkat kendaraan.');
      return;
    }

    const payload: CarInput = {
      brand,
      model,
      year: yearNum,
      pricePerDay: priceNum,
      seats: seatsNum,
      transmission: formData.transmission,
      fuelType: formData.fuelType,
      category,
      imageUrl,
      description,
      available: formData.available,
    };

    setIsSubmitting(true);
    try {
      if (editingCar) {
        await updateCar(editingCar.id, payload);
        setNotice({
          type: 'success',
          message: `Kendaraan "${brand} ${model}" berhasil diperbarui.`,
        });
      } else {
        await addCar(payload);
        setNotice({
          type: 'success',
          message: `Kendaraan baru "${brand} ${model}" berhasil ditambahkan.`,
        });
      }
      handleCloseForm();
      await fetchFleet();
    } catch (err) {
      console.error('Gagal menyimpan mobil:', err);
      setFormError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan kendaraan.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (car: Car) => {
    setCarToDelete(car);
  };

  const handleConfirmDelete = async () => {
    if (!carToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCar(carToDelete.id);
      setNotice({
        type: 'success',
        message: `Kendaraan "${carToDelete.brand} ${carToDelete.model}" berhasil dihapus.`,
      });
      setCarToDelete(null);
      await fetchFleet();
    } catch (err) {
      console.error('Gagal menghapus mobil:', err);
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menghapus kendaraan.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddSampleData = async () => {
    if (cars.length > 0) {
      setNotice({
        type: 'error',
        message: 'Data contoh hanya dapat ditambahkan jika daftar mobil masih kosong.',
      });
      return;
    }

    setIsAddingSample(true);
    try {
      const insertedCount = await insertSampleCars();
      setNotice({
        type: 'success',
        message: `${insertedCount} data contoh kendaraan berhasil ditambahkan.`,
      });
      await fetchFleet();
    } catch (err) {
      console.error('Gagal menambahkan data contoh mobil:', err);
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menambahkan data contoh mobil.',
      });
    } finally {
      setIsAddingSample(false);
    }
  };

  // Booking status update handler
  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: BookingStatus,
    carName: string
  ) => {
    setUpdatingBookingId(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
      setNotice({
        type: 'success',
        message: `Pesanan untuk ${carName} diperbarui menjadi "${getBookingStatusLabel(newStatus)}".`,
      });
      await fetchBookingsList();
    } catch (err) {
      console.error('Gagal memperbarui status pesanan:', err);
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memperbarui status pesanan.',
      });
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Filtered Bookings computation
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus =
        bookingFilter === 'all' || b.status === bookingFilter;

      const term = bookingSearch.toLowerCase().trim();
      const matchesSearch =
        !term ||
        b.userName.toLowerCase().includes(term) ||
        b.carName.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, bookingFilter, bookingSearch]);

  // Dashboard Stats Calculations
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const revenueTotal = bookings
    .filter((b) => b.status === 'completed' || b.status === 'confirmed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  if (!isAdmin) {
    return (
      <section className="page-container">
        <div className="auth-error-alert" role="alert">
          <span>⚠️ Akses ditolak: Halaman ini hanya dapat diakses oleh administrator.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container admin-dashboard">
      <header className="page-header admin-header">
        <div>
          <h1 className="page-title">Panel Administrasi</h1>
          <p className="page-subtitle">
            Masuk sebagai <strong>{user?.name || user?.email}</strong> (Administrator). Kelola data kendaraan dan pesanan pelanggan.
          </p>
        </div>

        {activeTab === 'fleet' && (
          <div className="admin-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddSampleData}
              disabled={isAddingSample || carsLoading || cars.length > 0}
              title={
                cars.length > 0
                  ? 'Data contoh hanya dapat ditambahkan jika daftar mobil masih kosong'
                  : 'Tambahkan 8 data contoh kendaraan'
              }
            >
              {isAddingSample ? 'Menambahkan data contoh...' : '✨ Tambah Data Contoh'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAdd}
            >
              + Tambah Mobil
            </button>
          </div>
        )}
      </header>

      {/* Notifications */}
      {notice && (
        <div
          className={`admin-notice ${
            notice.type === 'success' ? 'admin-notice-success' : 'auth-error-alert'
          }`}
          role="status"
        >
          <span>{notice.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{notice.message}</span>
          <button
            type="button"
            className="btn-icon-close"
            onClick={() => setNotice(null)}
            aria-label="Tutup pemberitahuan"
          >
            ×
          </button>
        </div>
      )}

      {/* Live Operational Stats */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <h4>Jumlah Kendaraan</h4>
          <p className="stat-value">{cars.length}</p>
          <span className="stat-label">Kendaraan terdaftar</span>
        </div>
        <div className="stat-card">
          <h4>Pesanan Menunggu</h4>
          <p className="stat-value" style={{ color: pendingCount > 0 ? '#b45309' : 'inherit' }}>
            {pendingCount}
          </p>
          <span className="stat-label">Pesanan menunggu konfirmasi</span>
        </div>
        <div className="stat-card">
          <h4>Pesanan Dikonfirmasi</h4>
          <p className="stat-value">{confirmedCount}</p>
          <span className="stat-label">Penyewaan aktif / dikonfirmasi</span>
        </div>
        <div className="stat-card">
          <h4>Total Pendapatan</h4>
          <p className="stat-value" style={{ fontSize: '1.4rem' }}>
            {formatIDR(revenueTotal)}
          </p>
          <span className="stat-label">Penyewaan terkonfirmasi dan selesai</span>
        </div>
      </div>

      {/* Admin Tab Switching */}
      <div className="admin-tabs-nav">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'fleet' ? 'active' : ''}`}
          onClick={() => setActiveTab('fleet')}
        >
          🚗 Daftar Kendaraan ({cars.length})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 Pesanan Pelanggan ({bookings.length})
          {pendingCount > 0 && (
            <span className="admin-tab-badge-pending">{pendingCount} menunggu</span>
          )}
        </button>
      </div>

      {/* TAB 1: FLEET MANAGEMENT */}
      {activeTab === 'fleet' && (
        <div className="admin-table-container">
          <div className="admin-table-toolbar">
            <h3 className="admin-table-title">Kendaraan ({cars.length})</h3>
          </div>

          {carsLoading && <LoadingSpinner message="Memuat data kendaraan..." />}

          {carsError && !carsLoading && (
            <div className="auth-error-alert" role="alert" style={{ margin: '1rem' }}>
              <span>⚠️ {carsError}</span>
              <button
                type="button"
                className="btn btn-secondary btn-outline-sm"
                style={{ marginLeft: 'auto' }}
                onClick={fetchFleet}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {!carsLoading && !carsError && cars.length === 0 && (
            <div className="empty-state">
              <h3>Belum Ada Kendaraan</h3>
              <p className="empty-state-hint">
                Daftar mobil masih kosong. Klik <strong>"Tambah Data Contoh"</strong> untuk menambahkan 8 kendaraan, atau pilih <strong>"+ Tambah Mobil"</strong> untuk membuat data baru.
              </p>
            </div>
          )}

          {!carsLoading && !carsError && cars.length > 0 && (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kendaraan</th>
                    <th>Kategori</th>
                    <th>Tahun</th>
                    <th>Harga / Hari</th>
                    <th>Spesifikasi</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map((car) => (
                    <tr key={car.id}>
                      <td>
                        <div className="table-vehicle-cell">
                          <img
                            src={car.imageUrl || 'https://placehold.co/100x70?text=Mobil'}
                            alt={`${car.brand} ${car.model}`}
                            className="table-vehicle-thumb"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://placehold.co/100x70?text=Mobil';
                            }}
                          />
                          <div>
                            <strong>
                              {car.brand} {car.model}
                            </strong>
                            <div className="table-vehicle-desc-preview">
                              {car.description.substring(0, 45)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="table-category-tag">{getCategoryLabel(car.category)}</span>
                      </td>
                      <td>{car.year}</td>
                      <td>
                        <strong>{formatIDR(car.pricePerDay)}</strong>
                      </td>
                      <td>
                        <div className="table-specs-summary">
                          <span>👥 {car.seats}s</span>
                          <span>⚙️ {getTransmissionLabel(car.transmission)}</span>
                          <span>⛽ {getFuelTypeLabel(car.fuelType)}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`table-status-pill ${
                            car.available ? 'status-pill-active' : 'status-pill-inactive'
                          }`}
                        >
                          {car.available ? 'Tersedia' : 'Tidak tersedia'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="btn btn-secondary btn-outline-sm"
                            onClick={() => handleOpenEdit(car)}
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-sm"
                            onClick={() => handleOpenDelete(car)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOOKINGS MANAGEMENT */}
      {activeTab === 'bookings' && (
        <div className="admin-table-container">
          <div className="admin-table-toolbar admin-bookings-toolbar">
            <div>
              <h3 className="admin-table-title">Pesanan Pelanggan ({bookings.length})</h3>
            </div>

            <div className="admin-bookings-filter-bar">
              <input
                type="text"
                placeholder="Cari nama pelanggan, mobil, atau ID..."
                className="form-input form-input-sm"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                style={{ maxWidth: '260px' }}
              />

              <select
                className="form-input form-input-sm"
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
                style={{ maxWidth: '160px' }}
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="confirmed">Dikonfirmasi</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>

              <button
                type="button"
                className="btn btn-secondary btn-outline-sm"
                onClick={fetchBookingsList}
                disabled={bookingsLoading}
              >
                ↻ Muat Ulang
              </button>
            </div>
          </div>

          {bookingsLoading && (
            <LoadingSpinner message="Memuat pesanan pelanggan..." />
          )}

          {bookingsError && !bookingsLoading && (
            <div className="auth-error-alert" role="alert" style={{ margin: '1rem' }}>
              <span>⚠️ {bookingsError}</span>
              <button
                type="button"
                className="btn btn-secondary btn-outline-sm"
                style={{ marginLeft: 'auto' }}
                onClick={fetchBookingsList}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {!bookingsLoading && !bookingsError && bookings.length === 0 && (
            <div className="empty-state">
              <h3>Belum Ada Pesanan</h3>
              <p className="empty-state-hint">
                Belum ada pesanan pelanggan di dalam daftar pesanan.
              </p>
            </div>
          )}

          {!bookingsLoading && !bookingsError && bookings.length > 0 && filteredBookings.length === 0 && (
            <div className="empty-state">
              <h3>Tidak Ada Pesanan yang Sesuai</h3>
              <p className="empty-state-hint">
                Tidak ada pesanan yang cocok dengan kata pencarian atau filter status.
              </p>
            </div>
          )}

          {!bookingsLoading && !bookingsError && filteredBookings.length > 0 && (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Pesanan / Pelanggan</th>
                    <th>Kendaraan</th>
                    <th>Tanggal Sewa</th>
                    <th>Durasi</th>
                    <th>Total Biaya</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.userName}</strong>
                        <div className="table-booking-subtext">
                          ID: #{b.id.substring(0, 8)} | UID: {b.userId.substring(0, 6)}...
                        </div>
                      </td>
                      <td>
                        <strong>{b.carName}</strong>
                      </td>
                      <td>
                        <span className="table-dates-pill">
                          {b.startDate} &rarr; {b.endDate}
                        </span>
                      </td>
                      <td>
                        {b.totalDays} hari
                      </td>
                      <td>
                        <strong>{formatIDR(b.totalPrice)}</strong>
                      </td>
                      <td>
                        <span className={`status-pill status-${b.status}`}>
                          {getBookingStatusLabel(b.status)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-group">
                          {/* Admin can Confirm, Complete, or Cancel any booking */}
                          {b.status !== 'confirmed' && b.status !== 'completed' && (
                            <button
                              type="button"
                              className="btn btn-success-sm"
                              onClick={() => handleUpdateStatus(b.id, 'confirmed', b.carName)}
                              disabled={updatingBookingId === b.id}
                              title="Konfirmasi pesanan ini"
                            >
                              Konfirmasi
                            </button>
                          )}

                          {b.status === 'confirmed' && (
                            <button
                              type="button"
                              className="btn btn-primary-sm"
                              onClick={() => handleUpdateStatus(b.id, 'completed', b.carName)}
                              disabled={updatingBookingId === b.id}
                              title="Tandai sebagai selesai"
                            >
                              Selesaikan
                            </button>
                          )}

                          {b.status !== 'cancelled' && (
                            <button
                              type="button"
                              className="btn btn-danger-sm"
                              onClick={() => handleUpdateStatus(b.id, 'cancelled', b.carName)}
                              disabled={updatingBookingId === b.id}
                              title="Batalkan pesanan ini"
                            >
                              Batalkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Car Modal Dialog */}
      {isFormOpen && (
        <div className="modal-backdrop" onClick={handleCloseForm}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <h2 id="modal-title">
                {editingCar ? `Ubah Mobil: ${editingCar.brand} ${editingCar.model}` : 'Tambah Kendaraan Baru'}
              </h2>
              <button
                type="button"
                className="btn-icon-close"
                onClick={handleCloseForm}
                aria-label="Tutup dialog"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="auth-error-alert" role="alert" style={{ margin: '1rem 1.5rem 0' }}>
                <span>⚠️ {formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="modal-form" noValidate>
              <div className="modal-form-grid">
                <div className="form-group">
                  <label htmlFor="car-brand">
                    Merek <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-brand"
                    type="text"
                    className="form-input"
                    placeholder="misalnya Toyota, Honda, Mitsubishi"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-model">
                    Model <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-model"
                    type="text"
                    className="form-input"
                    placeholder="misalnya Avanza 1.5 G, Brio RS"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-year">
                    Tahun Produksi <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-year"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 2}
                    className="form-input"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-category">
                    Kategori <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-category"
                    type="text"
                    className="form-input"
                    placeholder="misalnya mobil kota, SUV, MPV, sedan"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-price">
                    Harga per Hari (Rupiah) <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-price"
                    type="number"
                    min="10000"
                    step="5000"
                    className="form-input"
                    placeholder="misalnya 450000"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-seats">
                    Jumlah Kursi <span className="text-danger">*</span>
                  </label>
                  <input
                    id="car-seats"
                    type="number"
                    min="1"
                    max="30"
                    className="form-input"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="car-transmission">
                    Transmisi <span className="text-danger">*</span>
                  </label>
                  <select
                    id="car-transmission"
                    className="form-input"
                    value={formData.transmission}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transmission: e.target.value as TransmissionType,
                      })
                    }
                  >
                    <option value="automatic">Otomatis</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="car-fuel">
                    Jenis Bahan Bakar <span className="text-danger">*</span>
                  </label>
                  <select
                    id="car-fuel"
                    className="form-input"
                    value={formData.fuelType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fuelType: e.target.value as FuelType,
                      })
                    }
                  >
                    <option value="petrol">Bensin</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hibrida</option>
                    <option value="electric">Listrik</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="car-image">
                  URL Gambar <span className="text-danger">*</span>
                </label>
                <input
                  id="car-image"
                  type="url"
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="car-desc">
                  Deskripsi <span className="text-danger">*</span>
                </label>
                <textarea
                  id="car-desc"
                  rows={3}
                  className="form-input form-textarea"
                  placeholder="Jelaskan fitur, kondisi, dan kenyamanan kendaraan..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-group form-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) =>
                      setFormData({ ...formData, available: e.target.checked })
                    }
                  />
                  <span>Tandai tersedia untuk disewa</span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseForm}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Menyimpan...'
                    : editingCar
                    ? 'Simpan Perubahan'
                    : 'Tambah Kendaraan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog Modal */}
      {carToDelete && (
        <div className="modal-backdrop" onClick={() => setCarToDelete(null)}>
          <div
            className="modal-card modal-card-sm"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="modal-header">
              <h2 id="delete-dialog-title">Konfirmasi Penghapusan</h2>
              <button
                type="button"
                className="btn-icon-close"
                onClick={() => setCarToDelete(null)}
                aria-label="Batal menghapus"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Apakah Anda yakin ingin menghapus kendaraan ini secara permanen?{' '}
                <strong>
                  {carToDelete.brand} {carToDelete.model} ({carToDelete.year})
                </strong>
                ?
              </p>
              <p className="delete-warning-text">
                Tindakan ini tidak dapat dibatalkan dan kendaraan akan dihapus dari daftar mobil pelanggan.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCarToDelete(null)}
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Kendaraan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
