import { ReactNode } from "react";
import AllyContainer from "../components/ally/AllyContainer";
import styles from "./ally.module.css";
import { UserResumeProvider } from "../providers/userResumeContext";
export default function AllyLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <UserResumeProvider>
        <div className={styles.sidebar}>
          <AllyContainer />
        </div>
        {/* This is the "outlet" where nested routes will render */}
        <div className={styles.outlet}>{children}</div>
      </UserResumeProvider>
    </div>
  );
}
