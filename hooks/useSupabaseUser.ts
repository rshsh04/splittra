import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function useSupabaseUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          setUser(null);
        } else {
          setUser(data.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  return { user, loading };
}
