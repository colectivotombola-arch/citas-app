"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

interface VerificationRequest {
  id: number;
  user_id: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
}

export default function AdminPage() {
  const user = useUser();
  const router = useRouter();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const fetchRequests = async () => {
      setLoading(true);
      const res = await fetch('/api/admin/requests');
      if (res.status === 403) {
        setError('No tienes permisos para acceder a esta página.');
      } else {
        const json = await res.json();
        setRequests(json.requests || []);
      }
      setLoading(false);
    };
    fetchRequests();
  }, [user, router]);

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    const res = await fetch('/api/admin/verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id, status }),
    });
    if (res.ok) {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } else {
      alert('Error al actualizar la solicitud');
    }
  };

  if (loading) {
    return <p>Cargando...</p>;
  }
  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Panel de administración</h1>
      <h2>Solicitudes de verificación</h2>
      {requests.length === 0 ? (
        <p>No hay solicitudes pendientes.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc' }}>ID</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Usuario</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Estado</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Fecha</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{req.id}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{req.profiles?.full_name || req.profiles?.username || req.user_id}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{req.status}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{new Date(req.created_at).toLocaleString()}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(req.id, 'approved')}>Aprobar</button>
                      <button onClick={() => handleAction(req.id, 'rejected')} style={{ marginLeft: '0.5rem' }}>
                        Rechazar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}