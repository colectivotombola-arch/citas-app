"use client";

import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter, useParams } from 'next/navigation';

interface Message {
  id: number;
  match_id: number;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
      if (!error) {
        setMessages(data as Message[]);
      }
      setLoading(false);
    };
    fetchMessages();
    // Poll every 5 seconds for new messages (simplified)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [user, matchId, supabase, router]);

  const handleSend = async () => {
    if (!input.trim()) return;
    // Check message rate limit
    const { data: canSend } = await supabase.rpc('can_send_message', { p_user_id: user?.id });
    if (!canSend) {
      alert('Has excedido el límite de mensajes. Intenta más tarde.');
      return;
    }
    await supabase.from('messages').insert({ match_id: matchId, sender_id: user!.id, content: input.trim() });
    setInput('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Chat</h1>
      {loading ? (
        <p>Cargando mensajes...</p>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', padding: '1rem' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: '0.5rem', textAlign: msg.sender_id === user?.id ? 'right' : 'left' }}>
              <span
                style={{
                  background: msg.sender_id === user?.id ? '#dcf8c6' : '#f1f0f0',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.75rem',
                  display: 'inline-block',
                }}
              >
                {msg.content}
              </span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flexGrow: 1, padding: '0.5rem' }}
          placeholder="Escribe un mensaje..."
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </div>
  );
}