"use client";
import Link from "next/link";
import { useLoading } from "@/app/providers/loadingContext";
import { ReactNode } from "react";

export default function LoadingLink({
  children,
  href,
  ...props
}: {
  children: ReactNode;
  href: string;
  [key: string]: any;
}) {
  const { setIsLoading } = useLoading();

  const handleClick = () => {
    setIsLoading(true);
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
