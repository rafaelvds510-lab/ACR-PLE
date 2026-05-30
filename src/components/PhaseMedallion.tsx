import React from 'react';
import styles from './PhaseMedallion.module.css';

interface PhaseMedallionProps {
  roman: string;
  number: string;
}

const PhaseMedallion: React.FC<PhaseMedallionProps> = ({ roman, number }) => {
  return (
    <div className={styles.phaseMedallion}>
      <span className={styles.phaseRoman}>{roman}</span>
      <span className={styles.phaseNum}>{number}</span>
    </div>
  );
};

export default PhaseMedallion;
