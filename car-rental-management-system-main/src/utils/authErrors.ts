/**
 * Converts Firebase Authentication error codes to user-friendly Indonesian messages.
 */
export const getAuthErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Alamat email atau kata sandi salah. Silakan coba lagi.';
      case 'auth/email-already-in-use':
        return 'Akun dengan alamat email ini sudah terdaftar.';
      case 'auth/invalid-email':
        return 'Silakan masukkan alamat email yang valid.';
      case 'auth/weak-password':
        return 'Kata sandi harus terdiri dari minimal 6 karakter.';
      case 'auth/user-disabled':
        return 'Akun ini telah dinonaktifkan. Silakan hubungi dukungan.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan gagal. Tunggu beberapa menit sebelum mencoba kembali.';
      case 'auth/network-request-failed':
        return 'Koneksi jaringan bermasalah. Periksa koneksi Anda lalu coba kembali.';
      case 'auth/popup-closed-by-user':
        return 'Jendela masuk ditutup sebelum proses selesai.';
      default:
        return 'Terjadi kesalahan saat autentikasi. Silakan coba lagi.';
    }
  }

  return 'Terjadi kesalahan saat autentikasi. Silakan coba lagi.';
};
