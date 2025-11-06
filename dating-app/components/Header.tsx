"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useEffect, useState } from 'react';

interface HeaderProps {
  adminEmails?: string[];
}

// A simple header component that shows navigation links depending on
// authentication state.  When logged in, it provides a logout button and
// displays the user's email.  When logged out, it shows a login link.
export default function Header({ adminEmails }: HeaderProps) {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user && adminEmails && adminEmails.length > 0) {
      setIsAdmin(adminEmails.includes(user.email ?? ''));
    } else {
      setIsAdmin(false);
    }
  }, [user, adminEmails]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <nav>
      <Link href="/">Home</Link>
      {user ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/profile">Perfil</Link>
          {isAdmin && <Link href="/admin">Admin</Link>}
          <span style={{ marginLeft: 'auto', marginRight: '1rem' }}>{user.email}</span>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </>
      ) : (
        <Link href="/login">Iniciar sesión</Link>
      )}
    </nav>
  );
}