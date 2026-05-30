'use client';

import React, { useState } from 'react';
import { addUrlDocument } from '@/app/actions/library';

interface AddUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUrlModal({ isOpen, onClose, onSuccess }: AddUrlModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await addUrlDocument(title, url, category);
      if (res.error) {
        setError(res.error);
      } else {
        setUrl('');
        setTitle('');
        setCategory('');
        onSuccess();
        onClose();
      }
    } catch {
      setError('Ocorreu um erro ao salvar o link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--surface-base)',
        padding: '32px',
        borderRadius: 'var(--radius-md)',
        width: '100%',
        maxWidth: '500px',
        border: '1px solid var(--marble-deep)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel), serif', fontSize: '20px', color: 'var(--ink)', marginBottom: '16px' }}>
          Adicionar Artigo da Web
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--stone-dark)', marginBottom: '4px' }}>
              Link / URL *
            </label>
            <input 
              type="url" 
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://exemplo.com/artigo"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--marble-deep)', background: 'transparent', color: 'var(--ink)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--stone-dark)', marginBottom: '4px' }}>
              Título do Texto *
            </label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: A República de Platão"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--marble-deep)', background: 'transparent', color: 'var(--ink)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--stone-dark)', marginBottom: '4px' }}>
              Categoria / Tema
            </label>
            <input 
              type="text" 
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Ex: Filosofia, Marketing, etc"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--marble-deep)', background: 'transparent', color: 'var(--ink)' }}
            />
          </div>

          {error && <p style={{ color: 'var(--terra)', fontSize: '14px', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--marble-deep)', borderRadius: '4px', cursor: 'pointer', color: 'var(--stone)' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ flex: 1, padding: '10px', background: 'var(--gold)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', fontWeight: 600 }}
            >
              {isLoading ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
