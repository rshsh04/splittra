
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
        const sessionUser = data?.user ?? null;
        if (!sessionUser) {
          setUser(null);
          return;
        }

        // Ensure there's a row in the `users` table for this user, and fetch the full user row
        let userRow = null;
        try {
          // Look up the user row by email (avoid comparing uuid -> bigint id mismatches).
          const { data: rows, error: selectErr } = await supabase
            .from('users')
            .select('*')
            .eq('email', sessionUser.email)
            .limit(1);

          if (!selectErr && rows && rows.length > 0) {
            userRow = rows[0];
            // If user row exists but has no auth_id, update it
            if (!userRow.auth_id) {
              await supabase
                .from('users')
                .update({ auth_id: sessionUser.id })
                .eq('id', userRow.id);
              userRow.auth_id = sessionUser.id;
            }
          } else {
            // If not found, create/update user row via upsert on unique email
            const payload: any = {
              email: sessionUser.email,
              name: sessionUser.user_metadata?.name || '',
              profilePicture: "https://kfixndvekvohfhrwzcbo.supabase.co/storage/v1/object/public/PP/default-avatar.jpg",
              auth_id: sessionUser.id,
            }
            const { data: inserted, error: upsertErr } = await supabase
              .from('users')
              .upsert(payload, { onConflict: 'email' })
              .select('*')
              .maybeSingle()
            if (!upsertErr) {
              userRow = inserted
            }
          }
        } catch (e) {
          // ...
        }

        // Return a merged user object: numeric id, auth_id (uuid), plus sessionUser fields
        if (userRow) {
          setUser({
            ...sessionUser,
            ...userRow,
            id: userRow.id, // numeric users.id
            auth_id: sessionUser.id, // uuid
          });
        } else {
          setUser(sessionUser);
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
