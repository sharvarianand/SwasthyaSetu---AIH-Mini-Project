"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function AuthControls() { 
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <span className="auth-status">Checking account...</span>;
  
  if (user) {
    return (
      <div className="account">
        <span>Hi, {user.user_metadata?.full_name?.split(" ")[0] || "there"}</span>
        <button onClick={signOut}>Sign out</button>
      </div>
    );
  }
  
  return (
    <button className="google" onClick={signIn}>
      <span>G</span> Continue with Google
    </button>
  ); 
}
