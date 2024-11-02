import React, { useState, FormEvent, ReactNode } from "react";

export default function BaseForm({
  onSubmit,
  children,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return <form onSubmit={onSubmit}>{children}</form>;
}
