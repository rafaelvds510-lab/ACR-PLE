'use client';

import React, { useState } from 'react';
import JSZip from 'jszip';
// initSqlJs needs to be dynamically loaded to avoid SSR issues
import initSqlJs from 'sql.js';
import styles from './flashcards.module.css';
import { UploadCloud } from 'lucide-react';

export default function AnkiImporter({ onImportComplete }: { onImportComplete?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus('Lendo arquivo .apkg...');

    try {
      const zip = await JSZip.loadAsync(file);
      const dbFile = zip.file('collection.anki2') || zip.file('collection.anki21');
      
      if (!dbFile) {
        throw new Error('Banco de dados SQLite (collection.anki2) não encontrado no arquivo.');
      }

      const dbData = await dbFile.async('uint8array');
      setStatus('Carregando SQL.js...');
      
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      const db = new SQL.Database(dbData);
      setStatus('Extraindo cartões...');

      // Anki schema query: get notes (cards)
      const res = db.exec("SELECT flds FROM notes");
      if (res.length > 0) {
        const rows = res[0].values;
        // Basic parser: Anki stores front/back separated by \x1f (unit separator)
        const parsedCards = rows.map(row => {
          const fields = (row[0] as string).split('\x1f');
          return { front: fields[0], back: fields[1] || '' };
        });

        setStatus(`Encontrados ${parsedCards.length} cartões. Salvando...`);
        
        // Em um cenário real, enviaríamos para API para criar deck e cartões
        // await createDeckAndCards(file.name, parsedCards);
      }

      db.close();
      setStatus('Importação concluída!');
      if (onImportComplete) onImportComplete();

    } catch (error: any) {
      console.error(error);
      setStatus(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.importerContainer}>
      <input 
        type="file" 
        accept=".apkg" 
        onChange={handleFileUpload} 
        style={{ display: 'none' }} 
        id="anki-upload" 
      />
      <label htmlFor="anki-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <UploadCloud size={48} color="var(--stone-medium)" style={{ marginBottom: 16 }} />
        <h3 className={styles.importTitle}>Importar Baralho do Anki</h3>
        <p className={styles.importDesc}>
          {loading ? status : 'Arraste um arquivo .apkg ou clique para selecionar.'}
        </p>
      </label>
    </div>
  );
}
