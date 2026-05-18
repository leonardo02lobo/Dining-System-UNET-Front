import styles from "./UnetLogo.module.css"

type UnetLogoProps = {
  size?: number
}

export function UnetLogo({ size }: UnetLogoProps) {
  return (
    <img
      src="/assets/logo-unet.png"
      alt="UNET"
      className={styles.img}
      width={size}
      height={size}
    />
  )
}
