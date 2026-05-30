import React from 'react';
import styles from './SectionDivider.module.css';

interface SectionDividerProps {
  symbol?: string;
}

const SectionDivider: React.FC<SectionDividerProps> = ({ symbol = '⊕' }) => {
  return (
    <div className={styles.divider}>
      <div className={styles.dividerLine}></div>
      <div className={styles.dividerSymbol}>{symbol}</div>
      <div className={`${styles.dividerLine} ${styles.right}`}></div>
    </div>
  );
};

export default SectionDivider;
