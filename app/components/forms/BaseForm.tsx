import React, { useState, FormEvent, ReactNode } from "react";

export default function BaseForm({
  onSubmit,
  children,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <form role="form" onSubmit={onSubmit}>
      {children}
    </form>
  );
}
