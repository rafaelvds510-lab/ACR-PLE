import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Link, Hr } from '@react-email/components';

export interface WeeklyReportEmailProps {
  userName: string;
  levelTitle: string;
  levelIcon: string;
  totalXP: number;
  streakDays: number;
  cardsCreated: number;
  mapsCreated: number;
  nextSteps: Array<{ title: string; subtitle: string; actionUrl: string }>;
}

export const WeeklyReportEmail = ({
  userName,
  levelTitle,
  levelIcon,
  totalXP,
  streakDays,
  cardsCreated,
  mapsCreated,
  nextSteps = [],
}: WeeklyReportEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Cabeçalho */}
          <Section style={header}>
            <Text style={logo}>ACRÓPOLE</Text>
            <Text style={headerSub}>Olimpo Semanal</Text>
          </Section>

          {/* Saudação */}
          <Section style={content}>
            <Heading style={greeting}>Saudações, {userName}.</Heading>
            <Text style={paragraph}>
              Os deuses estão observando o seu progresso. Aqui está o resumo da sua jornada rumo à excelência nos últimos dias.
            </Text>

            {/* Destaque Nível */}
            <Section style={levelCard}>
              <Text style={levelBadge}>NÍVEL ATUAL</Text>
              <Text style={levelTitleStyle}>
                {levelIcon} {levelTitle}
              </Text>
              <Text style={levelXP}>{totalXP.toLocaleString()} XP Acumulados</Text>
            </Section>

            {/* Grid de Estatísticas / Gráfico Simulado */}
            <Heading style={sectionTitle}>Tábua de Feitos (Esta Semana)</Heading>
            <Section style={statsGrid}>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                <tr>
                  <td style={statBox}>
                    <Text style={statNum}>{streakDays}</Text>
                    <Text style={statLabel}>Dias de Foco</Text>
                  </td>
                  <td width="16"></td>
                  <td style={statBox}>
                    <Text style={statNum}>{cardsCreated}</Text>
                    <Text style={statLabel}>Flashcards</Text>
                  </td>
                  <td width="16"></td>
                  <td style={statBox}>
                    <Text style={statNum}>{mapsCreated}</Text>
                    <Text style={statLabel}>Mapas Mentais</Text>
                  </td>
                </tr>
              </table>
            </Section>

            {/* Barra de Progresso Visual (Simulada para email) */}
            <Section style={progressSection}>
              <Text style={progressLabel}>Consistência Diária</Text>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ marginTop: '8px' }}>
                <tr>
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <td key={day} style={{ padding: '0 2px' }}>
                      <div
                        style={{
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: day <= streakDays || streakDays >= 7 ? '#C9A84C' : '#E8E0CC',
                          width: '100%',
                        }}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', paddingTop: '8px' }}>
                    <Text style={{ fontSize: '10px', color: '#8B7355', margin: 0 }}>
                      {streakDays > 0 ? `Chama de Héstia: ${streakDays} dia(s) acesa 🔥` : 'A chama precisa ser acesa.'}
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            <Hr style={divider} />

            {/* Próximos Passos (Oráculo) */}
            <Heading style={sectionTitle}>O Oráculo Recomenda</Heading>
            {nextSteps.length > 0 ? (
              nextSteps.map((step, idx) => (
                <Section key={idx} style={stepCard}>
                  <Text style={stepTitle}>✦ {step.title}</Text>
                  <Text style={stepSub}>{step.subtitle}</Text>
                  <Link href={`https://acropole.app${step.actionUrl}`} style={button}>
                    Acessar
                  </Link>
                </Section>
              ))
            ) : (
              <Text style={paragraph}>O Olimpo está satisfeito. Todas as missões foram cumpridas.</Text>
            )}

            <Hr style={divider} />

            {/* Rodapé */}
            <Text style={footer}>
              Continue moldando o seu conhecimento. A excelência não é um ato, mas um hábito.
              <br />
              <Link href="https://acropole.app" style={footerLink}>
                Acessar Acrópole
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WeeklyReportEmail;

// --- Estilos Inline ---
const main = {
  backgroundColor: '#F5F0E8', // marble
  fontFamily: 'Georgia, serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 0',
  width: '600px',
  maxWidth: '100%',
};

const header = {
  textAlign: 'center' as const,
  paddingBottom: '24px',
};

const logo = {
  fontSize: '24px',
  fontFamily: 'Times New Roman, serif',
  letterSpacing: '0.2em',
  color: '#1A1208',
  margin: '0',
};

const headerSub = {
  fontSize: '12px',
  color: '#C9A84C',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  margin: '8px 0 0',
};

const content = {
  backgroundColor: '#FDFAF3',
  border: '1px solid #D4C9A8',
  borderRadius: '8px',
  padding: '40px',
  boxShadow: '0 4px 16px rgba(26,18,8,0.05)',
};

const greeting = {
  fontSize: '24px',
  color: '#1A1208',
  fontWeight: 'normal',
  marginTop: '0',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#3D2E14',
  marginBottom: '24px',
};

const levelCard = {
  backgroundColor: '#1A1208',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '32px',
  border: '1px solid #C9A84C',
};

const levelBadge = {
  fontSize: '10px',
  color: '#C9A84C',
  letterSpacing: '0.2em',
  margin: '0 0 8px',
};

const levelTitleStyle = {
  fontSize: '28px',
  color: '#E8C97A',
  margin: '0 0 8px',
};

const levelXP = {
  fontSize: '14px',
  color: '#BBA882',
  margin: '0',
  fontStyle: 'italic',
};

const sectionTitle = {
  fontSize: '18px',
  color: '#1A1208',
  fontWeight: 'normal',
  borderBottom: '1px solid #D4C9A8',
  paddingBottom: '8px',
  marginBottom: '16px',
};

const statsGrid = {
  marginBottom: '24px',
};

const statBox = {
  backgroundColor: '#FAF7F2',
  border: '1px solid #E8E0CC',
  borderRadius: '6px',
  padding: '16px',
  textAlign: 'center' as const,
  width: '33%',
};

const statNum = {
  fontSize: '28px',
  color: '#C9A84C',
  margin: '0 0 4px',
  fontWeight: 'bold',
};

const statLabel = {
  fontSize: '10px',
  color: '#8B7355',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  margin: '0',
};

const progressSection = {
  marginBottom: '32px',
  padding: '16px',
  backgroundColor: '#FAF7F2',
  borderRadius: '6px',
  border: '1px solid #E8E0CC',
};

const progressLabel = {
  fontSize: '12px',
  color: '#1A1208',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const stepCard = {
  backgroundColor: '#FAF7F2',
  borderLeft: '3px solid #C9A84C',
  padding: '16px',
  marginBottom: '16px',
};

const stepTitle = {
  fontSize: '16px',
  color: '#1A1208',
  margin: '0 0 4px',
  fontWeight: 'bold',
};

const stepSub = {
  fontSize: '14px',
  color: '#6B5C40',
  margin: '0 0 12px',
  lineHeight: '1.5',
};

const button = {
  backgroundColor: '#C9A84C',
  color: '#1A1208',
  padding: '10px 20px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  display: 'inline-block',
};

const divider = {
  borderColor: '#D4C9A8',
  margin: '32px 0',
};

const footer = {
  fontSize: '14px',
  color: '#8B7355',
  textAlign: 'center' as const,
  fontStyle: 'italic',
};

const footerLink = {
  color: '#C9A84C',
  textDecoration: 'underline',
  marginTop: '8px',
  display: 'inline-block',
  fontStyle: 'normal',
};
