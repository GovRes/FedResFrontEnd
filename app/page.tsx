import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <div className={styles.banner}>
        <Link href="/">Try two weeks for free!</Link>
      </div>
    </div>
  );
}
