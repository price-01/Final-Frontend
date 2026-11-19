import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <section className="page-container home-page">
      <header className="hero-banner">
        <h1>Selamat Datang di Rental Mobil</h1>
        <p className="hero-subtitle">
          Temukan, pesan, dan kelola penyewaan mobil pilihan dengan informasi terkini dan proses pemesanan yang mudah.
        </p>
        <div className="hero-cta-group">
          <Link to="/cars" className="btn btn-primary btn-large">
            Lihat Pilihan Mobil
          </Link>
          <Link to="/bookings" className="btn btn-outline btn-large">
            Lihat Pesanan Saya
          </Link>
        </div>
      </header>

      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🚘</div>
          <h3>Pilihan Mobil Beragam</h3>
          <p>Pilih kendaraan yang sesuai dengan perjalanan Anda, dari mobil ekonomis hingga SUV mewah.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Pemesanan Praktis</h3>
          <p>Pesan mobil dengan cepat melalui sistem pemesanan daring yang selalu diperbarui.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Aman &amp; Tepercaya</h3>
          <p>Akun dan data Anda dilindungi dengan sistem keamanan Firebase.</p>
        </div>
      </section>
    </section>
  );
};
