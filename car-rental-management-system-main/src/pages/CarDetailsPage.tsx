import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getCarById } from '../services/carService';
import { createBooking } from '../services/bookingService';
import { getDailyForecast } from '../services/weatherService';
import { NORTH_SULAWESI_CITIES, DEFAULT_CITY } from '../data/locations';
import { useAuth } from '../hooks';
import { LoadingSpinner } from '../components';
import type { Car, WeatherForecastResult } from '../types';
import { formatIDR } from '../utils/formatters';
import { getCategoryLabel, getFuelTypeLabel, getTransmissionLabel } from '../utils/uiText';

export const CarDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form State
  const [pickupCityName, setPickupCityName] = useState(DEFAULT_CITY.name);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Weather Forecast State
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecastResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Today formatted as YYYY-MM-DD
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    if (!id) {
      setError('ID kendaraan tidak ditemukan.');
      setLoading(false);
      return;
    }

    const fetchCar = async () => {
      setLoading(true);
      try {
        const data = await getCarById(id);
        if (data) {
          setCar(data);
          setError(null);
        } else {
          setError('Kendaraan tidak ditemukan.');
        }
      } catch (err) {
        console.error('Error fetching car details:', err);
        setError('Gagal memuat detail kendaraan. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  // Live calculation of duration and total price
  const { totalDays, totalPrice, dateError } = useMemo(() => {
    if (!startDate || !endDate) {
      return { totalDays: 0, totalPrice: 0, dateError: null };
    }

    if (startDate < today) {
      return {
        totalDays: 0,
        totalPrice: 0,
        dateError: 'Tanggal mulai tidak boleh sebelum hari ini.',
      };
    }

    if (endDate <= startDate) {
      return {
        totalDays: 0,
        totalPrice: 0,
        dateError: 'Tanggal selesai harus setelah tanggal mulai.',
      };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const days = diffDays > 0 ? diffDays : 0;
    const price = car ? days * car.pricePerDay : 0;

    return { totalDays: days, totalPrice: price, dateError: null };
  }, [startDate, endDate, today, car]);

  // Fetch Weather Forecast when dates are valid and city is selected
  useEffect(() => {
    if (!startDate || !endDate || totalDays <= 0 || dateError) {
      setWeatherForecast(null);
      return;
    }

    let isCancelled = false;
    const city =
      NORTH_SULAWESI_CITIES.find((c) => c.name === pickupCityName) || DEFAULT_CITY;

    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const result = await getDailyForecast(
          city.latitude,
          city.longitude,
          startDate,
          endDate,
          city.name,
          car?.category
        );
        if (!isCancelled) {
          setWeatherForecast(result);
        }
      } catch (err) {
        console.error('Weather forecast fetch error in page:', err);
      } finally {
        if (!isCancelled) {
          setWeatherLoading(false);
        }
      }
    };

    fetchWeather();

    return () => {
      isCancelled = true;
    };
  }, [startDate, endDate, totalDays, dateError, pickupCityName, car?.category]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (!user) {
      setBookingError('Anda harus masuk untuk memesan kendaraan.');
      return;
    }

    if (!car) {
      setBookingError('Detail kendaraan belum dimuat.');
      return;
    }

    if (!car.available) {
      setBookingError('Kendaraan ini sedang tidak tersedia untuk disewa.');
      return;
    }

    if (!startDate || !endDate) {
      setBookingError('Silakan pilih tanggal mulai dan tanggal selesai.');
      return;
    }

    if (startDate < today) {
      setBookingError('Tanggal mulai tidak boleh sebelum hari ini.');
      return;
    }

    if (endDate <= startDate) {
      setBookingError('Tanggal selesai harus setelah tanggal mulai.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createBooking({
        userId: user.uid,
        userName: user.name || user.email.split('@')[0],
        carId: car.id,
        carName: `${car.brand} ${car.model}`,
        startDate,
        endDate,
        totalDays,
        totalPrice,
        status: 'pending',
      });

      setBookingSuccess(
        `Pesanan berhasil dibuat untuk ${totalDays} hari di ${pickupCityName}! Status pesanan menunggu konfirmasi.`
      );
      setStartDate('');
      setEndDate('');
    } catch (err) {
      console.error('Booking failed:', err);
      setBookingError(
        err instanceof Error
          ? err.message
          : 'Pesanan gagal dibuat. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Memuat detail kendaraan..." />;
  }

  if (error || !car) {
    return (
      <section className="page-container">
        <nav className="breadcrumbs">
          <Link to="/cars">← Kembali ke Daftar Mobil</Link>
        </nav>
        <div className="empty-state">
          <h2>Kendaraan Tidak Ditemukan</h2>
          <p className="empty-state-hint">
            {error || 'Kendaraan yang Anda cari tidak tersedia atau telah dihapus.'}
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/cars" className="btn btn-primary">
              Lihat Mobil yang Tersedia
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container car-detail-page">
      <nav className="breadcrumbs">
        <Link to="/cars">← Kembali ke Daftar Mobil</Link>
        <span className="breadcrumb-separator">/</span>
        <span>
          {car.brand} {car.model}
        </span>
      </nav>

      <div className="car-detail-container">
        {/* Left Column: Image showcase */}
        <div className="car-detail-media">
          <div className="car-detail-image-box">
            <img
              src={car.imageUrl || 'https://placehold.co/800x500?text=Gambar+Mobil+Tidak+Tersedia'}
              alt={`${car.brand} ${car.model}`}
              className="car-detail-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://placehold.co/800x500?text=Gambar+Mobil+Tidak+Tersedia';
              }}
            />
            <span
              className={`car-badge detail-badge ${
                car.available ? 'badge-success' : 'badge-danger'
              }`}
            >
              {car.available ? 'Tersedia untuk Disewa' : 'Saat Ini Tidak Tersedia'}
            </span>
          </div>
        </div>

        {/* Right Column: Specification & details */}
        <div className="car-detail-info">
          <div className="car-detail-header">
            <span className="car-detail-category">{car.category}</span>
            <h1 className="car-detail-title">
              {car.brand} {car.model}
            </h1>
            <p className="car-detail-year">Tahun Produksi: {car.year}</p>
          </div>

          <div className="car-detail-pricing-box">
            <div className="price-tag">
              <span className="price-tag-amount">{formatIDR(car.pricePerDay)}</span>
              <span className="price-tag-unit">/ hari</span>
            </div>
            <span
              className={`status-pill ${
                car.available ? 'status-available' : 'status-unavailable'
              }`}
            >
              {car.available ? '● Siap Dipesan' : '● Sedang Disewa / Dalam Perawatan'}
            </span>
          </div>

          {/* Key Specs Grid */}
          <div className="car-detail-specs-grid">
            <div className="spec-item">
              <span className="spec-icon">👥</span>
              <div className="spec-meta">
                <span className="spec-label">Kapasitas</span>
                <strong className="spec-value">{car.seats} Kursi</strong>
              </div>
            </div>

            <div className="spec-item">
              <span className="spec-icon">⚙️</span>
              <div className="spec-meta">
                <span className="spec-label">Transmisi</span>
                <strong className="spec-value" style={{ textTransform: 'capitalize' }}>
                  {getTransmissionLabel(car.transmission)}
                </strong>
              </div>
            </div>

            <div className="spec-item">
              <span className="spec-icon">⛽</span>
              <div className="spec-meta">
                <span className="spec-label">Jenis Bahan Bakar</span>
                <strong className="spec-value" style={{ textTransform: 'capitalize' }}>
                  {getFuelTypeLabel(car.fuelType)}
                </strong>
              </div>
            </div>

            <div className="spec-item">
              <span className="spec-icon">🏷️</span>
              <div className="spec-meta">
                <span className="spec-label">Kategori</span>
                <strong className="spec-value" style={{ textTransform: 'capitalize' }}>
                  {getCategoryLabel(car.category)}
                </strong>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="car-detail-description">
            <h3>Tentang Kendaraan</h3>
            <p>{car.description || 'Belum ada deskripsi untuk kendaraan ini.'}</p>
          </div>

          {/* Booking Form Card */}
          <div className="car-booking-section">
            <h3 className="booking-section-title">Pesan Kendaraan Ini</h3>

            {!isAuthenticated ? (
              <div className="booking-guest-prompt">
                <p>
                  Silakan <strong>masuk</strong> untuk memesan kendaraan ini dan melihat ketersediaannya.
                </p>
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="btn btn-primary"
                  style={{ marginTop: '0.75rem', display: 'inline-flex' }}
                >
                  Masuk untuk Memesan
                </Link>
              </div>
            ) : !car.available ? (
              <div className="auth-error-alert" role="alert">
                <span>⚠️ Kendaraan ini sedang tidak tersedia untuk disewa.</span>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="booking-form" noValidate>
                {bookingError && (
                  <div className="auth-error-alert" role="alert">
                    <span>⚠️ {bookingError}</span>
                  </div>
                )}

                {bookingSuccess && (
                  <div className="admin-notice admin-notice-success" role="status">
                    <span>✅ {bookingSuccess}</span>
                    <Link
                      to="/bookings"
                      className="btn btn-secondary btn-outline-sm"
                      style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
                    >
                      Lihat Pesanan Saya
                    </Link>
                  </div>
                )}

                {/* Pick-up City Dropdown */}
                <div className="form-group">
                  <label htmlFor="booking-pickup-city">
                    📍 Kota Pengambilan (Sulawesi Utara)
                  </label>
                  <select
                    id="booking-pickup-city"
                    className="form-input"
                    value={pickupCityName}
                    onChange={(e) => setPickupCityName(e.target.value)}
                    disabled={isSubmitting}
                  >
                    {NORTH_SULAWESI_CITIES.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name} ({city.description})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates Selection */}
                <div className="booking-dates-grid">
                  <div className="form-group">
                    <label htmlFor="booking-start-date">Tanggal Pengambilan</label>
                    <input
                      id="booking-start-date"
                      type="date"
                      min={today}
                      className="form-input"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setBookingError(null);
                        setBookingSuccess(null);
                      }}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="booking-end-date">Tanggal Pengembalian</label>
                    <input
                      id="booking-end-date"
                      type="date"
                      min={startDate || today}
                      className="form-input"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setBookingError(null);
                        setBookingSuccess(null);
                      }}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {dateError && (
                  <p className="booking-date-error-text">⚠️ {dateError}</p>
                )}

                {/* Live Weather Forecast Card */}
                {weatherLoading && (
                  <div className="booking-weather-card weather-loading">
                    <span className="spinner-icon">⛅</span>
                    <span>Memeriksa prakiraan cuaca Open-Meteo untuk {pickupCityName}...</span>
                  </div>
                )}

                {!weatherLoading && weatherForecast && (
                  <div className="booking-weather-card">
                    <div className="booking-weather-header">
                      <div className="booking-weather-title">
                        <span className="weather-title-icon">⛅</span>
                        <strong>Prakiraan Cuaca {weatherForecast.cityName}</strong>
                        <span className="weather-api-tag">Open-Meteo</span>
                      </div>
                      {weatherForecast.isAvailable && weatherForecast.maxRainProbability > 0 && (
                        <span
                          className={`weather-rain-pill ${
                            weatherForecast.maxRainProbability >= 60
                              ? 'rain-high'
                              : weatherForecast.maxRainProbability >= 35
                              ? 'rain-med'
                              : 'rain-low'
                          }`}
                        >
                          💧 Peluang Hujan: {weatherForecast.maxRainProbability}%
                        </span>
                      )}
                    </div>

                    {weatherForecast.isAvailable && weatherForecast.days.length > 0 ? (
                      <>
                        <div className="booking-weather-days-row">
                          {weatherForecast.days.slice(0, 5).map((d) => (
                            <div key={d.date} className="weather-day-chip">
                              <span className="weather-day-date">
                                {new Date(d.date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                              <span className="weather-day-icon">{d.weatherIcon}</span>
                              <span className="weather-day-temp">
                                {d.tempMin}°-{d.tempMax}°
                              </span>
                              <span className="weather-day-prob">💧{d.precipitationProbability}%</span>
                            </div>
                          ))}
                        </div>

                        <div className="booking-weather-hint">
                          <span className="hint-icon">💡</span>
                          <span>{weatherForecast.hint}</span>
                        </div>
                      </>
                    ) : (
                      <div className="booking-weather-unavailable">
                        <p>ℹ️ {weatherForecast.message || weatherForecast.hint}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Cost Calculation Summary */}
                {totalDays > 0 && !dateError && (
                  <div className="booking-summary-box">
                    <div className="booking-summary-row">
                      <span>Kota Pengambilan:</span>
                      <strong>{pickupCityName}</strong>
                    </div>
                    <div className="booking-summary-row">
                      <span>Durasi Sewa:</span>
                      <strong>
                        {totalDays} hari
                      </strong>
                    </div>
                    <div className="booking-summary-row">
                      <span>Harga per Hari:</span>
                      <span>{formatIDR(car.pricePerDay)}</span>
                    </div>
                    <div className="booking-summary-divider" />
                    <div className="booking-summary-row total-row">
                      <span>Perkiraan Total Biaya:</span>
                      <strong className="summary-total-price">
                        {formatIDR(totalPrice)}
                      </strong>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={isSubmitting || !!dateError || !startDate || !endDate}
                  style={{ marginTop: '1rem' }}
                >
                  {isSubmitting ? 'Memproses Pesanan...' : 'Konfirmasi & Ajukan Pesanan'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
