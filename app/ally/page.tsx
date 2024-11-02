import styles from "../components/ally/ally.module.css";
import { AllyProvider } from "../providers";
import AllyContainer from "../components/ally/AllyContainer";

export default function Ally({ children }: { children: React.ReactNode }) {
  return (
    <div className={`content ${styles.ally}`}>
      <AllyProvider>
        <AllyContainer>{children}</AllyContainer>
      </AllyProvider>
    </div>
  );
}
