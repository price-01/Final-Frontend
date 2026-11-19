import React from 'react';

export interface FooterProps {
  companyName?: string;
  year?: number;
}

export const Footer: React.FC<FooterProps> = ({
  companyName = 'Sistem Manajemen Rental Mobil',
  year = new Date().getFullYear(),
}) => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          &copy; {year} {companyName}. Hak cipta dilindungi.
        </p>
        <p className="footer-subtext">
          Dibangun dengan React, TypeScript, Vite &amp; Firebase
        </p>
      </div>
    </footer>
  );
};
