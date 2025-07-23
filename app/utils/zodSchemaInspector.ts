import { z } from "zod";
export class ZodSchemaInspector {
  private schema: z.ZodObject<any>;

  constructor(schema: z.ZodObject<any>) {
    this.schema = schema;
  }
  isRequired(fieldName: string): boolean {
    try {
      const field = this.schema.shape[fieldName];
      if (!field) return false;
      const isOptional =
        field instanceof z.ZodOptional ||
        field._def.typeName === "ZodOptional" ||
        field.isOptional?.() === true;

      return !isOptional;
    } catch {
      return false;
    }
  }

  getRequiredFields(): string[] {
    return Object.keys(this.schema.shape).filter((key) => this.isRequired(key));
  }

  getOptionalFields(): string[] {
    return Object.keys(this.schema.shape).filter(
      (key) => !this.isRequired(key)
    );
  }
}
