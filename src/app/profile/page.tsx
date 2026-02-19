import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  const user = session.user;

  return (
    <div className="container" style={{ padding: '4rem 0', maxWidth: '600px' }}>
      <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Meu Perfil</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>Nome:</span>
            <span style={{ overflowWrap: 'break-word', minWidth: 0 }}>{user?.name || 'Não informado'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>Email:</span>
            <span style={{ overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 0 }}>{user?.email}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-light)' }}>Cargo:</span>
            <span style={{ 
              textTransform: 'capitalize', 
              padding: '2px 8px', 
              borderRadius: '4px', 
              background: (user as any).role === 'admin' ? '#fff5f5' : '#f0f4f8',
              color: (user as any).role === 'admin' ? '#c53030' : '#2d3748',
              fontSize: '0.9rem'
            }}>
              {(user as any).role || 'Usuário'}
            </span>
          </div>
        </div>

        <form 
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
          style={{ marginTop: '3rem', textAlign: 'center' }}
        >
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', background: '#c53030' }}>
            Sair da Conta
          </button>
        </form>
      </div>
    </div>
  );
}
