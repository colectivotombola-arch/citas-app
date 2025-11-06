"use client";

import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

interface ProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  birthdate: string | null;
  gender: string | null;
  photo_url: string | null;
  distance_preference: number | null;
  min_age: number | null;
  max_age: number | null;
  is_verified: boolean;
  onboarded: boolean;
}

export default function ProfilePage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) {
        setError(error.message);
      } else {
        setProfile(data as ProfileData);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, supabase, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    const updates = {
      full_name: profile.full_name,
      username: profile.username,
      bio: profile.bio,
      birthdate: profile.birthdate,
      gender: profile.gender,
      photo_url: profile.photo_url,
      distance_preference: profile.distance_preference,
      min_age: profile.min_age,
      max_age: profile.max_age,
      onboarded: true,
      updated_at: new Date(),
    };
    const { error } = await supabase.from('profiles').upsert({ id: user!.id, ...updates });
    if (error) {
      setError(error.message);
    } else {
      setStatus('Perfil guardado');
    }
    setLoading(false);
  };

  const handleLocation = async () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada en tu navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      if (!profile) return;
      setLoading(true);
      // send location to supabase
      const { error } = await supabase
        .from('profiles')
        .update({ location: `POINT(${longitude} ${latitude})` })
        .eq('id', user!.id);
      if (error) {
        setError(error.message);
      } else {
        setStatus('Ubicación guardada');
      }
      setLoading(false);
    }, (err) => {
      alert('Error al obtener ubicación');
    });
  };

  const handleVerifyRequest = async () => {
    const res = await fetch('/api/verification/request', { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      setStatus('¡Solicitud de verificación enviada!');
    } else {
      setStatus('No se pudo enviar la solicitud.');
    }
  };

  if (loading) {
    return <p>Cargando perfil...</p>;
  }

  if (!profile) {
    return <p>Error cargando el perfil: {error}</p>;
  }

  const age = profile.birthdate ? Math.floor((Date.now() - new Date(profile.birthdate).getTime()) / 31557600000) : null;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Tu perfil</h1>
      {status && <p>{status}</p>}
      <div>
        <label>Nombre completo</label>
        <input name="full_name" value={profile.full_name || ''} onChange={handleChange} />
      </div>
      <div>
        <label>Nombre de usuario</label>
        <input name="username" value={profile.username || ''} onChange={handleChange} />
      </div>
      <div>
        <label>Bio</label>
        <textarea name="bio" value={profile.bio || ''} onChange={handleChange} rows={3} />
      </div>
      <div>
        <label>Fecha de nacimiento</label>
        <input type="date" name="birthdate" value={profile.birthdate || ''} onChange={handleChange} />
        {age && <span> (Edad: {age})</span>}
      </div>
      <div>
        <label>Género</label>
        <input name="gender" value={profile.gender || ''} onChange={handleChange} />
      </div>
      <div>
        <label>Foto (URL)</label>
        <input name="photo_url" value={profile.photo_url || ''} onChange={handleChange} />
        {profile.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photo_url} alt="Foto de perfil" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }} />
        )}
      </div>
      <h2>Preferencias</h2>
      <div>
        <label>Distancia máxima (km)</label>
        <input type="number" name="distance_preference" value={profile.distance_preference || 50} onChange={handleChange} />
      </div>
      <div>
        <label>Edad mínima</label>
        <input type="number" name="min_age" value={profile.min_age || 18} onChange={handleChange} />
      </div>
      <div>
        <label>Edad máxima</label>
        <input type="number" name="max_age" value={profile.max_age || 99} onChange={handleChange} />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={handleSave} disabled={loading}>Guardar</button>
        <button onClick={handleLocation} disabled={loading} style={{ marginLeft: '1rem' }}>Actualizar ubicación</button>
      </div>
      <div style={{ marginTop: '2rem' }}>
        {profile.is_verified ? (
          <p>✅ Tu perfil está verificado.</p>
        ) : (
          <button onClick={handleVerifyRequest}>Solicitar verificación</button>
        )}
      </div>
    </div>
  );
}