import { StepsType } from "@/app/utils/responseSchemas";
import { IoCheckmarkCircle, IoEllipseOutline } from "react-icons/io5";
import Link from "next/link";
import styles from "./ally.module.css";

export default function AllyStepItem({ step }: { step: StepsType }) {
  return (
    <Link href={`/ally${step.path}`} className={styles.stepItem}>
      <div>{step.title}</div>
      <div>{step.completed ? <IoCheckmarkCircle /> : <IoEllipseOutline />}</div>
    </Link>
  );
}
