import { FormEvent } from "react";
import { z } from "zod";
export function getCheckboxValues(event: FormEvent<HTMLFormElement>) {
  const formData = new FormData(event.currentTarget);
  const values = Object.fromEntries(formData.entries());
  const valuesOfValues = Object.values(values);

  return valuesOfValues.map((v) => v.toString());
}

export function transformApiDataForForm<T extends Record<string, any>>(
  data: T,
  schema: z.ZodObject<any>
): T {
  const transformed = { ...data } as Record<string, any>;

  // Get optional fields from schema
  Object.keys(schema.shape).forEach((fieldName) => {
    const field = schema.shape[fieldName];
    const isOptional = field.isOptional?.() || field.isNullable?.();

    // Convert null to empty string for optional string fields
    if (isOptional && transformed[fieldName] === null) {
      transformed[fieldName] = "";
    }
  });

  return transformed as T;
}
