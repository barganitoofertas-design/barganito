"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar/Sidebar";
import AlertMatches from "./AlertMatches";
import { getCategories } from "./alert-actions";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [configs, setConfigs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    categoryId: "",
    productNamePattern: "",
    targetPrice: "",
    targetDiscount: "",
  });

  useEffect(() => {
    if (session) {
      fetch("/api/notifications")
        .then(async res => {
          if (res.status === 401) {
            setError("Sessão expirada ou usuário não encontrado. Por favor, saia e entre novamente.");
            return [];
          }
          return res.json();
        })
        .then(data => setConfigs(data));
      
      getCategories().then(setCategories);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const res = await fetch("/api/notifications", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const newConfig = await res.json();
      setConfigs([...configs, newConfig]);
      setFormData({ categoryId: "", productNamePattern: "", targetPrice: "", targetDiscount: "" });
      setRefreshKey(prev => prev + 1);
    } else {
      const errorData = await res.json();
      setError(errorData.error || "Erro ao salvar alerta");
      if (res.status === 401) {
        // Force refresh or logout logic could go here
      }
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setConfigs(configs.filter(c => c.id !== id));
      setRefreshKey(prev => prev + 1);
    }
  };

  if (!session) return <p>Acesso restrito. Faça login para ver seus alertas.</p>;

  return (
    <>
      <Sidebar />
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🎯</span> Configurar Novos Alertas
          </h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Receba notificações e veja ofertas personalizadas baseadas nos seus interesses.
          </p>

          {error && (
            <div style={{ padding: '1rem', background: '#fff5f5', color: '#c53030', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #feb2b2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <button 
                onClick={() => window.location.href = '/api/auth/signout'} 
                style={{ background: '#c53030', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Sair Agora
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Categoria (Opcional)</label>
              <select 
                value={formData.categoryId} 
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'white' }}
              >
                <option value="">Qualquer Categoria</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Termo de Busca (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ex: iPhone, Nike, Geladeira..." 
                value={formData.productNamePattern} 
                onChange={e => setFormData({...formData, productNamePattern: e.target.value})}
                style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Preço Máximo (R$)</label>
              <input 
                type="number" 
                placeholder="Ex: 5000" 
                value={formData.targetPrice} 
                onChange={e => setFormData({...formData, targetPrice: e.target.value})}
                style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Desconto Mínimo (%)</label>
              <input 
                type="number" 
                placeholder="Ex: 20" 
                value={formData.targetDiscount} 
                onChange={e => setFormData({...formData, targetDiscount: e.target.value})}
                style={{ padding: '0.7rem', borderRadius: '10px', border: '1px solid var(--border)' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', height: '45px', justifyContent: 'center' }}>
              Criar Alerta
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1.5rem' }}>Meus Alertas Ativos</h2>
          {configs.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
              Você ainda não tem alertas configurados. <br/> Comece criando um acima!
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {configs.map((config: any) => (
                <div key={config.id} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.8rem', 
                  padding: '1.2rem', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius)',
                  background: 'var(--background)'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                        {config.productNamePattern || 'Qualquer Produto'}
                      </strong>
                      <button onClick={() => handleDelete(config.id)} style={{ color: 'var(--text-light)', fontSize: '0.8rem', background: 'transparent' }}>
                        Remover
                      </button>
                    </div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {config.category?.name && (
                        <span style={{ fontSize: '0.75rem', background: 'white', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                          📁 {config.category.name}
                        </span>
                      )}
                      {config.targetPrice && (
                        <span style={{ fontSize: '0.75rem', background: 'white', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                          💰 Até R$ {config.targetPrice}
                        </span>
                      )}
                      {config.targetDiscount && (
                        <span style={{ fontSize: '0.75rem', background: 'white', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                          📉 {config.targetDiscount}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AlertMatches refreshKey={refreshKey} />
      </section>
    </>
  );
}
