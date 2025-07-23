import { z } from "zod";

type OptionalKeys<T extends z.ZodRawShape> = {
  [K in keyof T]: T[K] extends
    | z.ZodOptional<any>
    | z.ZodNullable<any>
    | z.ZodDefault<any>
    ? K
    : never;
}[keyof T];

type RequiredKeys<T extends z.ZodRawShape> = Exclude<keyof T, OptionalKeys<T>>;

export function createFormDataCleaner<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) {
  return function cleanFormData(
    data: z.infer<typeof schema>
  ): Partial<z.infer<typeof schema>> {
    const cleaned = { ...data };
    const shape = schema.shape;
    Object.keys(shape).forEach((key) => {
      const field = shape[key];
      const value = cleaned[key];
      if (
        (field.isOptional?.() || field.isNullable?.()) &&
        (value === "" || value === null || value === undefined)
      ) {
        delete cleaned[key];
      }
    });
    return cleaned;
  };
}

export function createFormDataDefaults<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  overrides: Partial<z.infer<typeof schema>> = {}
): z.infer<typeof schema> {
  const shape = schema.shape;
  const defaults = {} as any;
  Object.keys(shape).forEach((key) => {
    const field = shape[key];
    if (field._def.typeName === "ZodDefault") {
      defaults[key] = field._def.defaultValue();
    } else if (field.isOptional?.() || field.isNullable?.()) {
      defaults[key] = undefined;
    } else {
      defaults[key] = "";
    }
  });
  return { ...defaults, ...overrides };
}

export function useSmartForm<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  overrides: Partial<z.infer<typeof schema>> = {}
) {
  const cleanData = createFormDataCleaner(schema);
  const defaultValues = createFormDataDefaults(schema, overrides);
  const isFieldRequired = (fieldName: string): boolean => {
    const field = schema.shape[fieldName];
    return field && !field.isOptional?.() && !field.isNullable?.();
  };
  return {
    defaultValues,
    cleanData,
    isFieldRequired,
  };
}
