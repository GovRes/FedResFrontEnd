import NavigationLink from "./components/loader/NavigationLink";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div>
      <div className={styles.banner}>
        <NavigationLink href="/">Try two weeks for free!</NavigationLink>
      </div>
    </div>
  );
}
