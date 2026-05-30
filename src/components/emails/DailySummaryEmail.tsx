import * as React from 'react';

interface DailySummaryEmailProps {
  userName: string;
  date: string;
  stats: {
    studyHours: number;
    flashcards: number;
    arguments: number;
    threads: number;
  };
}

export const DailySummaryEmail: React.FC<Readonly<DailySummaryEmailProps>> = ({
  userName,
  date,
  stats,
}) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333', maxWidth: '600px', margin: '0 auto' }}>
    <h1 style={{ color: '#1a1a1a', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Resumo Diário - Acrópole</h1>
    <p>Olá, <strong>{userName}</strong>!</p>
    <p>Aqui está o seu progresso no dia {date}:</p>
    
    <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '10px' }}>📚 <strong>Horas de Estudo:</strong> {stats.studyHours}h</li>
        <li style={{ marginBottom: '10px' }}>🗂️ <strong>Flashcards Revisados:</strong> {stats.flashcards}</li>
        <li style={{ marginBottom: '10px' }}>⚔️ <strong>Argumentos em Debates:</strong> {stats.arguments}</li>
        <li style={{ marginBottom: '10px' }}>💬 <strong>Novos Tópicos no Fórum:</strong> {stats.threads}</li>
      </ul>
    </div>

    <p>Continue firme em sua jornada rumo à sabedoria!</p>
    <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />
    <p style={{ fontSize: '12px', color: '#888' }}>Você recebeu este e-mail porque é um membro da plataforma Acrópole.</p>
  </div>
);
