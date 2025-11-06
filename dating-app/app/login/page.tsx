"use client";

import { useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    // Already logged in, redirect to dashboard
    router.push('/dashboard');
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Hemos enviado un enlace mágico a tu correo. ¡Revísalo para iniciar sesión!');
      }
    } catch (err) {
      setMessage('Ocurrió un error al enviar el enlace de inicio de sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleLogin}>
        <label htmlFor="email">Correo electrónico:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
        />
        <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}