import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'raised' | 'gold' | 'minimal';
  className?: string;
  glow?: boolean;
  as?: React.ElementType;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  glow = false,
  as: Tag = 'div',
}) => {
  const classes = [
    styles.card,
    styles[variant],
    glow ? styles.glow : '',
    className,
  ].filter(Boolean).join(' ');

  return <Tag className={classes}>{children}</Tag>;
};

/* Sub-componentes */
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`${styles.cardHeader} ${className}`}>{children}</div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`${styles.cardBody} ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`${styles.cardFooter} ${className}`}>{children}</div>
);

export default Card;
