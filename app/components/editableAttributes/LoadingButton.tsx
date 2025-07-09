import { GrCycle } from "react-icons/gr";
import styles from "./editableAttributeStyles.module.css";

export default function LoadingButton({}) {
  return (
    <>
      <button disabled={true} className={`${styles.attributeIcon}`}>
        <GrCycle />
      </button>
    </>
  );
}
