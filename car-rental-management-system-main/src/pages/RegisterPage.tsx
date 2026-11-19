import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { getAuthErrorMessage } from '../utils/authErrors';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Silakan masukkan nama lengkap Anda.');
      return;
    }

    if (!trimmedEmail) {
      setError('Silakan masukkan alamat email Anda.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSubmitting(true);
    try {
      await register(trimmedName, trimmedEmail, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Gagal membuat akun:', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <h2 className="auth-title">Buat Akun</h2>
        <p className="auth-subtitle">Daftar untuk memesan mobil pilihan Anda dengan mudah.</p>

        {error && (
          <div className="auth-error-alert" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="reg-name">Nama Lengkap</label>
            <input
              id="reg-name"
              type="text"
              placeholder="Nama lengkap Anda"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="form-input"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Alamat Email</label>
            <input
              id="reg-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className="form-input"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Kata Sandi</label>
            <input
              id="reg-password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className="form-input"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm">Konfirmasi Kata Sandi</label>
            <input
              id="reg-confirm"
              type="password"
              placeholder="Masukkan kembali kata sandi"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(null);
              }}
              className="form-input"
              disabled={submitting}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? 'Sedang membuat akun...' : 'Buat Akun'}
          </button>
        </form>

        <p className="auth-footer-text">
          Sudah memiliki akun? <Link to="/login">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
};
