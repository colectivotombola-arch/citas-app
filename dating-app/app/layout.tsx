import '@/app/globals.css';
import Providers from './providers';
import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/auth';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Quedamos Hoy',
  description: 'Una app de citas y encuentros verificados en Ecuador',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // On the server we can check the current session to decide if the user is
  // authenticated.  This is used to determine the header links.  If there is
  // no session the Header will fall back to a login link.
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') ?? [];

  return (
    <html lang="es">
      <body>
        <Providers>
          <Header adminEmails={adminEmails} />
          <main className="container">{children}</main>
        </Providers>
      </body>
    </html>
  );
}