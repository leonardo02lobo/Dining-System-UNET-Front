import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: ReactNode
}

function Card({
  variant = 'default',
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  const classes = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

function CardHeader({ title, subtitle, action, children, className, ...props }: CardHeaderProps) {
  return (
    <div className={[styles.cardHeader, className ?? ''].join(' ')} {...props}>
      {(title || subtitle) ? (
        <div className={styles.cardHeaderContent}>
          {title && <h2 className={styles.cardTitle}>{title}</h2>}
          {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        </div>
      ) : children}
      {action && <div className={styles.cardHeaderAction}>{action}</div>}
    </div>
  )
}

function CardBody({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.cardBody, className ?? ''].join(' ')} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.cardFooter, className ?? ''].join(' ')} {...props}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export { Card }
