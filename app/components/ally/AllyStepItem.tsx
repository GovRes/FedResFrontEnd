"use client";

import { StepsType } from "@/app/utils/responseSchemas";
import {
  IoCheckmarkCircle,
  IoEllipse,
  IoEllipseOutline,
} from "react-icons/io5";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./ally.module.css";

export default function AllyStepItem({ step }: { step: StepsType }) {
  const pathname = usePathname();
  const isCurrentPath = pathname === `/ally${step.path}`;

  if (step.disabled) {
    return (
      <div
        className={`${styles.stepItem} ${styles.disabledStep}`}
        data-step-id={step.id}
      >
        <div>{step.title}</div>
        <div>
          {step.completed || isCurrentPath ? (
            isCurrentPath ? (
              <IoEllipse
                style={{
                  color: "#22c55e",
                }}
              />
            ) : (
              <IoCheckmarkCircle />
            )
          ) : (
            <IoEllipseOutline />
          )}
        </div>
      </div>
    );
  }
  return (
    <Link
      href={`/ally${step.path}`}
      className={styles.stepItem}
      data-step-id={step.id}
    >
      <div>{step.title}</div>
      <div>
        {step.completed || isCurrentPath ? (
          isCurrentPath ? (
            <IoEllipse
              style={{
                color: "#22c55e",
              }}
            />
          ) : (
            <IoCheckmarkCircle />
          )
        ) : (
          <IoEllipseOutline />
        )}
      </div>
    </Link>
  );
}
