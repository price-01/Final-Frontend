import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCars } from '../services/carService';
import { getRecommendations } from '../services/aiService';
import { getWeatherSummaryForCity } from '../services/weatherService';
import { NORTH_SULAWESI_CITIES } from '../data/locations';
import { LoadingSpinner } from '../components';
import type { Car, CarSummary, RecommendResponse } from '../types';
import { formatIDR } from '../utils/formatters';
import { getCategoryLabel, getFuelTypeLabel, getTransmissionLabel } from '../utils/uiText';

const EXAMPLE_CHIPS = [
  '4 orang, ke Tomohon, hemat BBM',
  'Liburan keluarga 7 orang, butuh bagasi luas & nyaman',
  'Mobil matic lincah untuk keliling kota',
  'SUV tangguh bertenaga diesel untuk medan menanjak',
  'Paling murah untuk operasional harian dalam kota',
];

export const AssistantPage: React.FC = () => {
  const [fleet, setFleet] = useState<Car[]>([]);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [fleetError, setFleetError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [weatherPreview, setWeatherPreview] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendResponse | null>(null);

  // Load active fleet on mount
  useEffect(() => {
    const loadFleet = async () => {
      setFleetLoading(true);
      try {
        const allCars = await getCars();
        setFleet(allCars);
        setFleetError(null);
      } catch (err) {
        console.error('Gagal memuat daftar mobil untuk Asisten AI:', err);
        setFleetError('Gagal memuat daftar mobil yang tersedia. Silakan muat ulang halaman.');
      } finally {
        setFleetLoading(false);
      }
    };

    loadFleet();
  }, []);

  // When destination city changes, optionally fetch 3-day weather preview
  useEffect(() => {
    if (!destinationCity) {
      setWeatherPreview(null);
      return;
    }

    const city = NORTH_SULAWESI_CITIES.find((c) => c.name === destinationCity);
    if (!city) return;

    let isCancelled = false;
    setWeatherLoading(true);

    getWeatherSummaryForCity(city, 3)
      .then((summary) => {
        if (!isCancelled) {
          setWeatherPreview(summary);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat pratinjau cuaca:', err);
        if (!isCancelled) {
          setWeatherPreview(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setWeatherLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [destinationCity]);

  // Filter only available cars and map to CarSummary
  const availableCarSummaries = useMemo<CarSummary[]>(() => {
    return fleet
      .filter((car) => car.available)
      .map((car) => ({
        id: car.id,
        brand: car.brand,
        model: car.model,
        category: car.category,
        seats: car.seats,
        transmission: car.transmission,
        fuelType: car.fuelType,
        pricePerDay: car.pricePerDay,
        available: car.available,
      }));
  }, [fleet]);

  // Lookup map to get full Car details for result rendering
  const carMap = useMemo(() => {
    const map = new Map<string, Car>();
    fleet.forEach((c) => map.set(c.id, c));
    return map;
  }, [fleet]);

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const textToSubmit = (customQuery !== undefined ? customQuery : query).trim();

    if (!textToSubmit) {
      setApiError('Silakan masukkan kebutuhan perjalanan atau kriteria mobil Anda.');
      return;
    }

    if (textToSubmit.length > 300) {
      setApiError('Pertanyaan maksimal 300 karakter.');
      return;
    }

    if (availableCarSummaries.length === 0) {
      setApiError('Saat ini belum ada mobil yang tersedia untuk disewa di katalog kami.');
      return;
    }

    setApiError(null);
    setIsSubmitting(true);

    try {
      // If destination city is selected, ensure we have its 3-day weather summary string
      let weatherContext: string | undefined = undefined;

      if (destinationCity) {
        const city = NORTH_SULAWESI_CITIES.find((c) => c.name === destinationCity);
        if (city) {
          weatherContext =
            weatherPreview || (await getWeatherSummaryForCity(city, 3));
        }
      }

      const response = await getRecommendations(
        textToSubmit,
        availableCarSummaries,
        weatherContext
      );
      setResult(response);
    } catch (err) {
      console.error('Kesalahan rekomendasi AI:', err);
      setApiError(
        err instanceof TypeError
          ? 'Tidak dapat terhubung ke layanan rekomendasi. Periksa koneksi internet Anda lalu coba lagi.'
          : err instanceof Error
          ? err.message
          : 'Gagal memproses rekomendasi AI. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChipClick = (chipText: string) => {
    setQuery(chipText);
    setApiError(null);
    handleSubmit(undefined, chipText);
  };

  return (
    <section className="page-container ai-assistant-page">
      <header className="page-header">
        <div className="ai-badge-header">
          <span className="ai-sparkle-icon">✨</span>
          <span>Didukung Gemini AI + Cuaca Open-Meteo</span>
        </div>
        <h1 className="page-title">Asisten Rekomendasi Rental Mobil</h1>
        <p className="page-subtitle">
          Ceritakan rencana perjalanan, destinasi, atau preferensi Anda. AI kami akan memadukan kondisi cuaca aktual dengan katalog armada kami untuk merekomendasikan kendaraan terbaik.
        </p>
      </header>

      {fleetLoading && <LoadingSpinner message="Mempersiapkan data armada kendaraan..." />}

      {fleetError && !fleetLoading && (
        <div className="auth-error-alert" role="alert">
          <span>⚠️ {fleetError}</span>
        </div>
      )}

      {!fleetLoading && !fleetError && (
        <div className="ai-assistant-container">
          {/* Query Input Card */}
          <div className="ai-input-card">
            <form onSubmit={(e) => handleSubmit(e)} className="ai-form">
              {/* Destination City Selection (Optional) */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="ai-destination-city" className="ai-destination-label">
                  📍 Destinasi / Kota Kunjungan (Opsional)
                  <span className="ai-optional-tag">Prakiraan cuaca 3 hari akan dianalisis otomatis</span>
                </label>
                <select
                  id="ai-destination-city"
                  className="form-input"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">-- Pilih Kota Destinasi di Sulawesi Utara (Opsional) --</option>
                  {NORTH_SULAWESI_CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} - {c.description}
                    </option>
                  ))}
                </select>

                {weatherLoading && (
                  <div className="ai-weather-status">
                    <span>⛅ Memeriksa data prakiraan cuaca 3 hari untuk {destinationCity}...</span>
                  </div>
                )}

                {weatherPreview && !weatherLoading && (
                  <div className="ai-weather-preview-box">
                    <span className="weather-preview-icon">⛅</span>
                    <span className="weather-preview-text">
                      <strong>Informasi Cuaca Open-Meteo:</strong> {weatherPreview}
                    </span>
                  </div>
                )}
              </div>

              {/* Textarea */}
              <div className="form-group">
                <div className="ai-textarea-header">
                  <label htmlFor="ai-query">Kebutuhan Perjalanan Anda</label>
                  <span
                    className={`ai-char-counter ${
                      query.length > 280 ? 'ai-counter-warning' : ''
                    }`}
                  >
                    {query.length} / 300
                  </span>
                </div>
                <textarea
                  id="ai-query"
                  rows={3}
                  className="form-input form-textarea"
                  placeholder="Contoh: 4 orang, ke Tomohon, hemat BBM, anggaran 500 ribu per hari..."
                  value={query}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setQuery(e.target.value);
                      if (apiError) setApiError(null);
                    }
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {/* Example Prompt Chips */}
              <div className="ai-chips-wrapper">
                <span className="ai-chips-label">Coba contoh permintaan:</span>
                <div className="ai-chips-list">
                  {EXAMPLE_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="ai-chip-btn"
                      onClick={() => handleChipClick(chip)}
                      disabled={isSubmitting}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ai-submit-bar">
                <span className="ai-fleet-stat-badge">
                  🚗 {availableCarSummaries.length} mobil tersedia akan dianalisis
                  {destinationCity ? ` | 📍 Cuaca ${destinationCity} disertakan` : ''}
                </span>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !query.trim()}
                >
                  {isSubmitting ? 'Menganalisis kebutuhan...' : '✨ Dapatkan Rekomendasi'}
                </button>
              </div>
            </form>
          </div>

          {/* Error Banner */}
          {apiError && (
            <div className="auth-error-alert" role="alert" style={{ marginTop: '1.5rem' }}>
              <span>⚠️ {apiError}</span>
              <button
                type="button"
                className="btn btn-secondary btn-outline-sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => handleSubmit()}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Loading State */}
          {isSubmitting && (
            <div className="ai-loading-box">
              <div className="spinner" />
              <h3>Sedang memilihkan mobil terbaik...</h3>
              <p>Menganalisis kapasitas, rute, cuaca Open-Meteo, transmisi, efisiensi bahan bakar, dan tarif sewa.</p>
            </div>
          )}

          {/* Results Display */}
          {result && !isSubmitting && (
            <div className="ai-results-section">
              {/* Summary Box */}
              <div className="ai-summary-card">
                <div className="ai-summary-header">
                  <span className="ai-summary-icon">💡</span>
                  <h3>Saran Asisten Rental</h3>
                </div>
                <p className="ai-summary-text">{result.summary}</p>
              </div>

              {/* Recommendations List */}
              {result.recommendations.length === 0 ? (
                <div className="empty-state" style={{ marginTop: '1.5rem' }}>
                  <h3>Tidak Ada Mobil Yang Cocok</h3>
                  <p className="empty-state-hint">
                    Coba perluas kriteria pencarian, sesuaikan anggaran, atau hubungi admin kami untuk permintaan armada khusus.
                  </p>
                </div>
              ) : (
                <div className="ai-recommendations-grid">
                  {result.recommendations.map((rec, index) => {
                    const car = carMap.get(rec.carId);
                    if (!car) return null;

                    return (
                      <article key={rec.carId} className="ai-recommendation-card">
                        <div className="ai-rec-rank-badge">
                          Pilihan #{index + 1}
                        </div>

                        <div className="ai-rec-image-wrap">
                          <img
                            src={car.imageUrl || 'https://placehold.co/400x250?text=Car'}
                            alt={`${car.brand} ${car.model}`}
                            className="ai-rec-image"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://placehold.co/400x250?text=Car';
                            }}
                          />
                          <span className="table-category-tag ai-rec-category">
                            {getCategoryLabel(car.category)}
                          </span>
                        </div>

                        <div className="ai-rec-body">
                          <div className="ai-rec-title-row">
                            <h3 className="ai-rec-car-name">
                              {car.brand} {car.model} ({car.year})
                            </h3>
                            <div className="ai-rec-price">
                              <span className="price-amount">{formatIDR(car.pricePerDay)}</span>
                              <span className="price-unit">/ hari</span>
                            </div>
                          </div>

                          <div className="car-specs" style={{ margin: '0.75rem 0' }}>
                            <span>⚙️ {getTransmissionLabel(car.transmission)}</span>
                            <span>⛽ {getFuelTypeLabel(car.fuelType)}</span>
                            <span>👥 {car.seats} Kursi</span>
                          </div>

                          {/* AI Reason Callout */}
                          <div className="ai-reason-box">
                            <div className="ai-reason-badge">Alasan Rekomendasi</div>
                            <p className="ai-reason-text">{rec.reason}</p>
                          </div>

                          <div className="ai-rec-footer">
                            <Link to={`/cars/${car.id}`} className="btn btn-primary btn-block">
                              Lihat Detail &amp; Pesan Mobil Ini &rarr;
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
