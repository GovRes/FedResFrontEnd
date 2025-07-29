"use client";

import { StepsType } from "@/app/utils/responseSchemas";
import {
  IoCheckmarkCircle,
  IoEllipse,
  IoEllipseOutline,
} from "react-icons/io5";
import { usePathname } from "next/navigation";
import styles from "./ally.module.css";
import NavigationLink from "../loader/NavigationLink";

export default function AllyStepItem({ step }: { step: StepsType }) {
  const pathname = usePathname();
  const isInitialStep =
    pathname === "/ally/job-paste" ||
    pathname === "/ally/usa-jobs" ||
    pathname === "/ally/job-search";
  const isCurrentPath =
    pathname === `/ally${step.path}` ||
    (isInitialStep && step.id === "usa-jobs");

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
    <NavigationLink
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
    </NavigationLink>
  );
}
