import styles from './Footer.module.css'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.copy}>
          © {year} Universidad Nacional Experimental del Táchira
        </span>
        <span className={styles.divider} aria-hidden>·</span>
        <span className={styles.right}>
          Secretaría — Sistema de Comedor Universitario
        </span>
      </div>
    </footer>
  )
}
