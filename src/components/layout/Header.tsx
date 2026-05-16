import { UnetLogo } from '../ui/UnetLogo'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <UnetLogo size={56} />

          <div className={styles.brandText}>
            <span className={styles.universityName}>
              Universidad Nacional Experimental del Táchira
            </span>
            <span className={styles.department}>Secretaría</span>
            <span className={styles.unit}>
              Coordinación de Control y Evaluación Estudiantil
            </span>
          </div>
        </div>

        <div className={styles.systemBadge}>
          <span className={styles.systemLabel}>Sistema de</span>
          <span className={styles.systemName}>Comedor Universitario</span>
        </div>
      </div>
    </header>
  )
}
