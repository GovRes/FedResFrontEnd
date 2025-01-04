import styles from "../components/ally/ally.module.css";
import AllyContainer from "../components/ally/AllyContainer";

export default function Ally() {
  return (
    <div className={`content ${styles.ally}`}>
      <AllyContainer />
    </div>
  );
}
