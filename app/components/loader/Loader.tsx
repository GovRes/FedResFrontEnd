import styles from "./loader.module.css";

export function Loader({ text }: { text?: string }) {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p>{text || "Loading"}</p>
    </div>
  );
}
