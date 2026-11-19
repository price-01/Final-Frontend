import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <section className="page-container not-found-page">
      <div className="not-found-card">
        <h1>404</h1>
        <h2>Halaman Tidak Ditemukan</h2>
        <p>Halaman yang Anda cari tidak tersedia atau telah dipindahkan.</p>
        <Link to="/" className="btn btn-primary">
          Kembali ke Beranda
        </Link>
      </div>
    </section>
  );
};
