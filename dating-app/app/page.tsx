import { createServerSupabaseClient } from '@/lib/auth';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h1>Quedamos Hoy</h1>
      <p>Conoce gente nueva, crea conexiones reales y vive experiencias únicas.</p>
      {user ? (
        <Link href="/dashboard"><button>Ir al Dashboard</button></Link>
      ) : (
        <Link href="/login"><button>Iniciar sesión</button></Link>
      )}
      <div style={{ marginTop: '2rem' }}>
        <Link href="/terms">Términos y Condiciones</Link>
        {' | '}
        <Link href="/privacy">Política de Privacidad</Link>
      </div>
    </div>
  );
}