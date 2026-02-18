"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Credenciais inválidas");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', gridColumn: '1 / -1' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Entrar no Barganito</h2>
        {error && <p style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label>Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }}>
            Entrar
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
          <span style={{ background: 'var(--card-bg)', padding: '0 0.5rem', position: 'relative', zIndex: 1 }}>ou</span>
          <hr style={{ position: 'absolute', top: '50%', width: '100%', border: '0', borderTop: '1px solid var(--border)' }} />
        </div>

        <button 
          onClick={() => signIn("google")} 
          className="btn" 
          style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--border)', background: 'white' }}
        >
          Entrar com Google
        </button>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Não tem conta? <Link href="/auth/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
