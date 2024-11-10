import { FormEvent } from "react";

export function getCheckboxValues(event: FormEvent<HTMLFormElement>) {
  const formData = new FormData(event.currentTarget);
  const values = Object.fromEntries(formData.entries());
  const valuesOfValues = Object.values(values);

  return valuesOfValues.map((v) => v.toString());
}
