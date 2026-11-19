import React, { useState, useMemo } from 'react';
import { useCars } from '../hooks';
import { CarCard, LoadingSpinner } from '../components';
import { getCategoryLabel } from '../utils/uiText';

export const CarsPage: React.FC = () => {
  const { cars, loading, error, refetch } = useCars();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTransmission, setSelectedTransmission] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');

  // Dynamically extract unique categories from loaded cars
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    cars.forEach((car) => {
      if (car.category) {
        categories.add(car.category.toLowerCase());
      }
    });
    return Array.from(categories);
  }, [cars]);

  // Filtered cars computation
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        car.brand.toLowerCase().includes(term) ||
        car.model.toLowerCase().includes(term) ||
        `${car.brand} ${car.model}`.toLowerCase().includes(term);

      const matchesCategory =
        selectedCategory === 'all' ||
        car.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesTransmission =
        selectedTransmission === 'all' ||
        car.transmission === selectedTransmission;

      const matchesAvailability =
        selectedAvailability === 'all' ||
        (selectedAvailability === 'available' && car.available) ||
        (selectedAvailability === 'unavailable' && !car.available);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesTransmission &&
        matchesAvailability
      );
    });
  }, [
    cars,
    searchTerm,
    selectedCategory,
    selectedTransmission,
    selectedAvailability,
  ]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedTransmission !== 'all' ||
    selectedAvailability !== 'all';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTransmission('all');
    setSelectedAvailability('all');
  };

  return (
    <section className="page-container">
      <header className="page-header">
        <h1 className="page-title">Mobil yang Tersedia</h1>
        <p className="page-subtitle">
          Temukan mobil rental yang paling sesuai untuk perjalanan Anda.
        </p>
      </header>

      {/* Filter and Search Controls */}
      <div className="catalog-filters-card">
        <div className="filters-grid">
          {/* Search by brand or model */}
          <div className="filter-group">
            <label htmlFor="search-input">Cari Mobil</label>
            <input
              id="search-input"
              type="text"
              className="form-input"
              placeholder="Cari berdasarkan merek atau model (misalnya Toyota, Brio)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter by Category */}
          <div className="filter-group">
            <label htmlFor="category-select">Kategori</label>
            <select
              id="category-select"
              className="form-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Transmission */}
          <div className="filter-group">
            <label htmlFor="transmission-select">Transmisi</label>
            <select
              id="transmission-select"
              className="form-input"
              value={selectedTransmission}
              onChange={(e) => setSelectedTransmission(e.target.value)}
            >
              <option value="all">Semua Transmisi</option>
              <option value="automatic">Otomatis</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {/* Filter by Availability */}
          <div className="filter-group">
            <label htmlFor="availability-select">Ketersediaan</label>
            <select
              id="availability-select"
              className="form-input"
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="available">Hanya yang Tersedia</option>
              <option value="unavailable">Tidak Tersedia</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="filter-active-bar">
            <span>
              Menampilkan {filteredCars.length} dari {cars.length} mobil
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-outline-sm"
              onClick={handleResetFilters}
            >
              Atur Ulang Filter
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <LoadingSpinner message="Memuat daftar mobil yang tersedia..." />
      )}

      {/* Error State */}
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

      {/* Empty Database State */}
      {!loading && !error && cars.length === 0 && (
        <div className="empty-state">
          <h3>Belum Ada Mobil</h3>
          <p className="empty-state-hint">
            Daftar mobil masih kosong. Administrator dapat menambahkan mobil atau
            mengisi data contoh melalui Panel Admin.
          </p>
        </div>
      )}

      {/* Filter Empty State */}
      {!loading && !error && cars.length > 0 && filteredCars.length === 0 && (
        <div className="empty-state">
          <h3>Tidak Ada Mobil yang Sesuai</h3>
          <p className="empty-state-hint">
            Coba ubah kata pencarian atau hapus beberapa filter.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary-sm"
              onClick={handleResetFilters}
            >
              Hapus Semua Filter
            </button>
          </div>
        </div>
      )}

      {/* Cars Grid */}
      {!loading && !error && filteredCars.length > 0 && (
        <div className="cars-grid">
          {filteredCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </section>
  );
};
