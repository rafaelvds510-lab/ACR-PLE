import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'foundation' | 'build' | 'advanced' | 'growth' | 'scale' | 'gold' | 'stone';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'gold',
  children,
  icon,
  className = '',
  style,
}) => {
  const classes = [styles.badge, styles[variant], className].filter(Boolean).join(' ');
  return (
    <span className={classes} style={style}>
      {icon && <span className={styles.badgeIcon}>{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
