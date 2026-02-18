"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar/Sidebar";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [configs, setConfigs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    category: "",
    productNamePattern: "",
    targetPrice: "",
    targetDiscount: "",
  });

  useEffect(() => {
    if (session) {
      fetch("/api/notifications")
        .then(res => res.json())
        .then(data => setConfigs(data));
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/notifications", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const newConfig = await res.json();
      setConfigs([...configs, newConfig]);
      setFormData({ category: "", productNamePattern: "", targetPrice: "", targetDiscount: "" });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setConfigs(configs.filter(c => c.id !== id));
    }
  };

  if (!session) return <p>Acesso restrito. Faça login para ver seus alertas.</p>;

  return (
    <>
      <Sidebar />
      <section>
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Criar Novo Alerta</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label>Categoria</label>
              <input 
                type="text" 
                placeholder="Ex: Eletrônicos" 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label>Produto (Nome)</label>
              <input 
                type="text" 
                placeholder="Ex: iPhone" 
                value={formData.productNamePattern} 
                onChange={e => setFormData({...formData, productNamePattern: e.target.value})}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label>Preço Máximo (R$)</label>
              <input 
                type="number" 
                placeholder="Ex: 5000" 
                value={formData.targetPrice} 
                onChange={e => setFormData({...formData, targetPrice: e.target.value})}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label>Desconto Mínimo (%)</label>
              <input 
                type="number" 
                placeholder="Ex: 20" 
                value={formData.targetDiscount} 
                onChange={e => setFormData({...formData, targetDiscount: e.target.value})}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', justifyContent: 'center' }}>
              Criar Alerta
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1.5rem' }}>Meus Alertas</h2>
          {configs.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>Você ainda não tem alertas configurados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {configs.map((config: any) => (
                <div key={config.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div>
                    {config.productNamePattern && <strong style={{ display: 'block' }}>{config.productNamePattern}</strong>}
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                      {config.category || 'Qualquer Categoria'} / 
                      {config.targetPrice ? ` R$ ${config.targetPrice}` : ' Qualquer Preço'} / 
                      {config.targetDiscount ? ` ${config.targetDiscount}% OFF` : ' Qualquer Desconto'}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(config.id)} style={{ color: 'var(--primary)', fontWeight: 600, background: 'transparent' }}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
