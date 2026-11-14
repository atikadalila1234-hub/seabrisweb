import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthUser, UserRole } from '../types';

/**
 * Autentikasi memakai Supabase Auth (email + password).
 * Nama, role, jabatan, dan instansi diambil dari tabel public.profiles.
 *
 * API publiknya sengaja dibuat sama seperti versi lama
 * (getCurrentUser, isAdmin, subscribe, logout, ...) supaya komponen lain tidak berubah.
 * Satu-satunya beda: login() sekarang async (mengembalikan Promise).
 */

type LoginResult = { success: boolean; user?: AuthUser; message?: string };

function formatLastLogin(): string {
  const now = new Date();
  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const date = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${date}, ${time}`;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();

  constructor() {
    this.init();
  }

  /** Pulihkan sesi saat halaman dibuka ulang & pantau perubahan sesi. */
  private init(): void {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void this.applySession(data.session);
    });

    supabase.auth.onAuthStateChange((event, session) => {
      // Jangan await query Supabase langsung di dalam callback ini (bisa deadlock),
      // jadi dibungkus setTimeout.
      setTimeout(() => {
        if (event === 'SIGNED_OUT' || !session) {
          this.setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          if (!this.currentUser || this.currentUser.id !== session.user.id) {
            void this.applySession(session);
          }
        }
      }, 0);
    });
  }

  private async fetchProfile(userId: string, email: string): Promise<AuthUser | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,name,username,role,title,agency')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      username: data.username ?? undefined,
      email,
      role: data.role as UserRole,
      title: data.title ?? undefined,
      agency: data.agency ?? undefined,
      lastLogin: formatLastLogin(),
    };
  }

  private async applySession(session: Session): Promise<AuthUser | null> {
    const user = await this.fetchProfile(session.user.id, session.user.email ?? '');
    if (!user) {
      // Akun ada di Supabase Auth tapi belum punya baris di tabel profiles -> tolak
      await supabase.auth.signOut();
      this.setUser(null);
      return null;
    }
    this.setUser(user);
    return user;
  }

  private setUser(user: AuthUser | null): void {
    this.currentUser = user;
    this.listeners.forEach((cb) => cb(this.currentUser));
  }

  public subscribe(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  public isOperator(): boolean {
    return this.currentUser?.role === 'operator';
  }

  /** Login dengan EMAIL dan password (akun dibuat di Supabase > Authentication > Users). */
  public async login(identifier: string, password: string): Promise<LoginResult> {
    const email = identifier.trim().toLowerCase();
    const pw = password.trim();

    if (!email || !pw) {
      return { success: false, message: 'Email dan Password wajib diisi.' };
    }
    if (!email.includes('@')) {
      return { success: false, message: 'Silakan masuk menggunakan alamat email Anda.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });

    if (error || !data.session) {
      return { success: false, message: 'Email atau Password salah. Silakan periksa kembali.' };
    }

    const user = await this.applySession(data.session);
    if (!user) {
      return {
        success: false,
        message: 'Akun ini belum terdaftar sebagai petugas/admin. Hubungi administrator.',
      };
    }

    return { success: true, user };
  }

  /** Logout: hapus sesi di Supabase dan kembali ke web publik. */
  public logout(): void {
    this.setUser(null);
    void supabase.auth.signOut();
  }
}

export const authService = new AuthService();
