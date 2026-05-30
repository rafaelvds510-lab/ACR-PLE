'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UploadAreaProps {
  onUploadSuccess?: () => void;
}

export default function UploadArea({ onUploadSuccess }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    const file = files[0];

    // Allowed types
    const allowedTypes = [
      'application/pdf',
      'application/epub+zip',
      'application/msword', // doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/rtf',
      'text/rtf'
    ];

    // Allow validation by extension as fallback
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['pdf', 'epub', 'doc', 'docx', 'rtf'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      setError('Por favor, envie apenas arquivos PDF, EPUB, DOCX ou RTF.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('O arquivo excede o limite de 50MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // Start progress

    try {
      // 1. Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 2. Upload to Storage
      // Path format: userId/timestamp_filename
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from('library')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // 3. Save metadata to database
      // Get a clean title by removing the extension
      const title = file.name.replace(new RegExp(`\\.${fileExt}$`, 'i'), '');
      
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: title,
          file_path: filePath,
          size_bytes: file.size
        });

      if (dbError) {
        // Rollback storage if db fails
        await supabase.storage.from('library').remove([filePath]);
        throw dbError;
      }

      setUploadProgress(100);
      
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Success callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
      // Refresh router to show new document
      router.refresh();
      
    } catch (err: unknown) {
      console.error('Upload error:', err);
      const message = err instanceof Error ? err.message : 'Erro ao enviar o arquivo.';
      setError(message);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  return (
    <div 
      style={{
        border: `2px dashed ${isDragging ? 'var(--gold)' : 'var(--marble-deep)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '40px',
        textAlign: 'center',
        background: isDragging ? 'rgba(201, 168, 76, 0.05)' : 'var(--surface-base)',
        transition: 'all var(--transition-fast)',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        accept=".pdf,.epub,.doc,.docx,.rtf,application/pdf,application/epub+zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/rtf"
        ref={fileInputRef}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      <div style={{ pointerEvents: 'none' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          background: 'var(--marble)',
          color: 'var(--stone-dark)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          border: '1px solid var(--marble-deep)'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>

        <h3 style={{ fontFamily: 'var(--font-cinzel), serif', fontSize: '18px', color: 'var(--ink)', marginBottom: '8px' }}>
          {isUploading ? 'Enviando Arquivo...' : 'Envie um novo Arquivo'}
        </h3>
        
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: 'var(--stone)', margin: 0 }}>
          {isUploading 
            ? 'Aguarde um momento enquanto os escribas trabalham.' 
            : 'Arraste e solte o arquivo aqui, ou clique para buscar.'}
        </p>

        {!isUploading && (
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--stone-light)' }}>
            PDF, EPUB, DOCX ou RTF (Máximo de 50MB)
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          height: '4px', 
          background: 'var(--marble-deep)', 
          width: '100%' 
        }}>
          <div style={{
            height: '100%',
            width: `${uploadProgress}%`,
            background: 'var(--gold)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ 
          marginTop: '16px', 
          color: 'var(--terra)', 
          fontSize: '13px', 
          fontFamily: 'Inter, system-ui, sans-serif' 
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
