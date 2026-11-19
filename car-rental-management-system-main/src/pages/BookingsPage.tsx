import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, useBookings } from '../hooks';
import { cancelBooking } from '../services/bookingService';
import { LoadingSpinner } from '../components';
import type { Booking } from '../types';
import { formatIDR } from '../utils/formatters';
import { getBookingStatusLabel } from '../utils/uiText';

export const BookingsPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();

  // Fetch only this customer's bookings by their Firebase Auth uid
  const { bookings, loading, error, refetch } = useBookings(user ? user.uid : '');

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleOpenCancel = (booking: Booking) => {
    setBookingToCancel(booking);
    setActionNotice(null);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    setCancellingId(bookingToCancel.id);
    try {
      await cancelBooking(bookingToCancel.id);
      setActionNotice({
        type: 'success',
        text: `Pesanan untuk ${bookingToCancel.carName} berhasil dibatalkan.`,
      });
      setBookingToCancel(null);
      await refetch();
    } catch (err) {
      console.error('Gagal membatalkan pesanan:', err);
      setActionNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Pesanan gagal dibatalkan.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Memeriksa autentikasi..." />;
  }

  if (!isAuthenticated || !user) {
    return (
      <section className="page-container">
        <header className="page-header">
          <h1 className="page-title">Pesanan Saya</h1>
          <p className="page-subtitle">Lihat dan kelola pesanan rental Anda.</p>
        </header>

        <div className="empty-state">
          <h2>Anda Perlu Masuk</h2>
          <p className="empty-state-hint">
            Silakan masuk ke akun Anda untuk melihat riwayat dan pesanan mendatang.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link
              to="/login"
              state={{ from: location }}
              className="btn btn-primary"
            >
              Masuk untuk Melihat Pesanan
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container bookings-page">
      <header className="page-header">
        <h1 className="page-title">Pesanan Saya</h1>
        <p className="page-subtitle">
          Kelola dan pantau kendaraan, jadwal, serta status pesanan Anda.
        </p>
      </header>

      {/* Notifications */}
      {actionNotice && (
        <div
          className={`admin-notice ${
            actionNotice.type === 'success'
              ? 'admin-notice-success'
              : 'auth-error-alert'
          }`}
          role="status"
        >
          <span>{actionNotice.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{actionNotice.text}</span>
          <button
            type="button"
            className="btn-icon-close"
            onClick={() => setActionNotice(null)}
            aria-label="Tutup pesan"
          >
            ×
          </button>
        </div>
      )}

      {loading && <LoadingSpinner message="Memuat pesanan Anda..." />}

      {error && !loading && (
        <div className="auth-error-alert" role="alert">
          <span>⚠️ {error}</span>
          <button
            type="button"
            className="btn btn-secondary btn-outline-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => refetch()}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="empty-state">
          <h3>Belum Ada Pesanan</h3>
          <p className="empty-state-hint">
            Anda belum memiliki pesanan. Lihat pilihan mobil yang tersedia dan pesan kendaraan untuk perjalanan Anda.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/cars" className="btn btn-primary">
              Lihat Mobil yang Tersedia
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="customer-bookings-grid">
          {bookings.map((booking) => (
            <article key={booking.id} className="customer-booking-card">
              <div className="customer-booking-header">
                <div>
                  <h3 className="customer-booking-car-title">{booking.carName}</h3>
                  <span className="customer-booking-id">ID: #{booking.id.substring(0, 8)}</span>
                </div>
                <span className={`status-pill status-${booking.status}`}>
                  {getBookingStatusLabel(booking.status)}
                </span>
              </div>

              <div className="customer-booking-details">
                <div className="booking-info-item">
                  <span className="booking-info-label">Periode Sewa</span>
                  <strong className="booking-info-value">
                    {booking.startDate} &rarr; {booking.endDate}
                  </strong>
                </div>

                <div className="booking-info-item">
                  <span className="booking-info-label">Durasi</span>
                  <strong className="booking-info-value">
                    {booking.totalDays} hari
                  </strong>
                </div>

                <div className="booking-info-item">
                  <span className="booking-info-label">Total Biaya</span>
                  <strong className="booking-info-value booking-amount-highlight">
                    {formatIDR(booking.totalPrice)}
                  </strong>
                </div>

                <div className="booking-info-item">
                  <span className="booking-info-label">Tanggal Pemesanan</span>
                  <span className="booking-info-value" style={{ fontSize: '0.85rem' }}>
                    {new Date(booking.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="customer-booking-footer">
                <Link to={`/cars/${booking.carId}`} className="btn btn-secondary btn-outline-sm">
                  Lihat Kendaraan
                </Link>

                {/* Cancel button: Only allowed for "pending" bookings */}
                {booking.status === 'pending' ? (
                  <button
                    type="button"
                    className="btn btn-danger-sm"
                    onClick={() => handleOpenCancel(booking)}
                    disabled={cancellingId === booking.id}
                  >
                    {cancellingId === booking.id ? 'Membatalkan...' : 'Batalkan Pesanan'}
                  </button>
                ) : (
                  <span className="booking-status-hint">
                    {booking.status === 'confirmed' && 'Pesanan telah dikonfirmasi'}
                    {booking.status === 'completed' && 'Perjalanan selesai'}
                    {booking.status === 'cancelled' && 'Pesanan dibatalkan'}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Customer Cancellation */}
      {bookingToCancel && (
        <div className="modal-backdrop" onClick={() => setBookingToCancel(null)}>
          <div
            className="modal-card modal-card-sm"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-dialog"
          >
            <div className="modal-header">
              <h2 id="cancel-booking-dialog">Batalkan Pesanan</h2>
              <button
                type="button"
                className="btn-icon-close"
                onClick={() => setBookingToCancel(null)}
                aria-label="Tutup dialog"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Apakah Anda yakin ingin membatalkan pesanan untuk{' '}
                <strong>{bookingToCancel.carName}</strong> ({bookingToCancel.startDate} &rarr;{' '}
                {bookingToCancel.endDate})?
              </p>
              <p className="delete-warning-text">
                Pesanan Anda akan langsung ditandai sebagai dibatalkan.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setBookingToCancel(null)}
                disabled={cancellingId !== null}
              >
                Pertahankan Pesanan
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={cancellingId !== null}
              >
                {cancellingId !== null ? 'Membatalkan...' : 'Ya, Batalkan Pesanan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
