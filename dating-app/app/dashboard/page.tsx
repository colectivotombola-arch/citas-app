"use client";

import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  photo_url: string | null;
  birthdate: string | null;
  location?: any;
  is_verified: boolean;
}

export default function DashboardPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rewindsAvailable, setRewindsAvailable] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch initial feed and rewind status
  useEffect(() => {
    if (!user) return;
    const getFeed = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_next_profiles', { p_user_id: user.id });
      if (!error) {
        setProfiles(data || []);
        setCurrent(0);
      }
      setLoading(false);
    };
    const getRewinds = async () => {
      const res = await fetch('/api/rewind/status');
      const json = await res.json();
      setRewindsAvailable(json.rewindsAvailable);
    };
    getFeed();
    getRewinds();
  }, [user, supabase]);

  // Display success message from Stripe if present
  useEffect(() => {
    if (searchParams.get('success')) {
      setMessage('¡Gracias por tu suscripción! Disfruta de tus beneficios premium.');
    }
    if (searchParams.get('canceled')) {
      setMessage('La suscripción fue cancelada o falló. Puedes intentarlo de nuevo.');
    }
  }, [searchParams]);

  if (!user) {
    return <p>Cargando...</p>;
  }

  const currentProfile = profiles[current];

  const handleLike = async () => {
    if (!currentProfile) return;
    const res = await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: currentProfile.id }),
    });
    const json = await res.json();
    if (json.match) {
      alert('¡Es un match! Ahora puedes chatear.');
    }
    moveNext();
  };

  const handlePass = async () => {
    if (!currentProfile) return;
    await fetch('/api/pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: currentProfile.id }),
    });
    moveNext();
  };

  const moveNext = () => {
    setCurrent((prev) => prev + 1);
  };

  const handleRewind = async () => {
    const res = await fetch('/api/rewind', { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      // Reload feed
      const { data } = await supabase.rpc('get_next_profiles', { p_user_id: user.id });
      setProfiles(data || []);
      setCurrent(0);
      setRewindsAvailable((prev) => prev - 1);
    } else {
      alert(json.message);
    }
  };

  return (
    <div>
      <h1>Descubre perfiles</h1>
      {message && <p>{message}</p>}
      {rewindsAvailable > 0 && (
        <button onClick={handleRewind}>⏪ Rewind ({rewindsAvailable})</button>
      )}
      {loading ? (
        <p>Cargando perfiles...</p>
      ) : currentProfile ? (
        <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
          {currentProfile.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentProfile.photo_url} alt={currentProfile.username || 'Foto'} style={{ width: '100%', borderRadius: '0.5rem' }} />
          )}
          <h2>
            {currentProfile.full_name || currentProfile.username}{' '}
            {currentProfile.is_verified && <span title="Perfil verificado">✅</span>}
          </h2>
          {currentProfile.birthdate && (
            <p>Edad: {Math.floor((Date.now() - new Date(currentProfile.birthdate).getTime()) / 31557600000)}</p>
          )}
          {currentProfile.bio && <p>{currentProfile.bio}</p>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={handlePass}>Saltar</button>
            <button onClick={handleLike}>Me gusta</button>
          </div>
        </div>
      ) : (
        <p>No hay más perfiles por ahora. Vuelve más tarde.</p>
      )}
      <div style={{ marginTop: '2rem' }}>
        <h3>¿Quieres más funciones?</h3>
        <p>Suscríbete a premium para ver quién te dio like, tener más rewinds y otros beneficios.</p>
        <SubscribeButton />
      </div>
    </div>
  );
}

function SubscribeButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleSubscribe = async () => {
    setLoading(true);
    const res = await fetch('/api/stripe/create-session', { method: 'POST' });
    const json = await res.json();
    if (json.url) {
      router.push(json.url);
    } else {
      alert('Error al crear la sesión de pago.');
      setLoading(false);
    }
  };
  return (
    <button onClick={handleSubscribe} disabled={loading}>
      {loading ? 'Redirigiendo...' : 'Probar Premium'}
    </button>
  );
}