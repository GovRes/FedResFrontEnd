import React, { ChangeEvent, useEffect, useState } from "react";
import { z } from "zod";
import styles from "./forms.module.css";

interface FormFieldProps<T extends z.ZodRawShape> {
  allowNull?: boolean;
  cols?: number;
  errors: any;
  label: string;
  name: keyof z.infer<z.ZodObject<T>>;
  options?: Record<string, string>;
  placeholder?: string;
  register: any;
  rows?: number;
  schema: z.ZodObject<T>;
  type?: string;
}

interface ToggleProps<T extends z.ZodRawShape> {
  name: keyof z.infer<z.ZodObject<T>>;
  label: string;
  schema: z.ZodObject<T>;
  register: any;
  errors: any;
}

interface CheckboxesProps<T extends z.ZodRawShape> {
  additionalClassName?: string;
  errors: any;
  label?: string;
  name: keyof z.infer<z.ZodObject<T>>;
  options: { id: number | string; name: string }[];
  register: any;
  schema: z.ZodObject<T>;
}

interface RadioSelectProps<T extends z.ZodRawShape> {
  additionalClassName?: string;
  errors: any;
  label?: string;
  name: keyof z.infer<z.ZodObject<T>>;
  options: { id: number | string; name: string }[];
  register: any;
  schema: z.ZodObject<T>;
}

export const Checkbox = ({
  handleChange,
  name,
}: {
  handleChange: React.ChangeEventHandler<HTMLInputElement>;
  name: string;
}) => {
  return <input name={name} onChange={handleChange} type="checkbox" />;
};

export const CheckboxWithLabel = ({
  handleChange,
  label,
  name,
}: {
  handleChange: React.ChangeEventHandler<HTMLInputElement>;
  label: string;
  name: string;
}) => {
  return (
    <div className={styles.checkboxWithLabel}>
      <span>{label}:</span>{" "}
      <span>
        <input name={name} onChange={handleChange} type="checkbox" />
      </span>
    </div>
  );
};

export function Checkboxes<T extends z.ZodRawShape>({
  additionalClassName = "",
  errors,
  label,
  name,
  options,
  register,
  schema,
}: CheckboxesProps<T>) {
  const field = schema.shape[name as string];
  const isRequired = field && !field.isOptional?.() && !field.isNullable?.();
  const fieldError = errors[name as string];

  return (
    <div className="mb-4">
      {label && (
        <label className="block mb-2">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        className={`${styles.checkboxWrapper} ${styles[additionalClassName]}`}
      >
        {options.map((option, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              {...register(name)}
              id={`checkbox-${name as string}-${index}`}
              type="checkbox"
              value={option.id}
              className="mr-2"
            />
            <label
              htmlFor={`checkbox-${name as string}-${index}`}
              className="cursor-pointer"
            >
              {option.name}
            </label>
          </div>
        ))}
      </div>
      {fieldError && (
        <p className="text-red-500 text-sm mt-1">{fieldError.message}</p>
      )}
    </div>
  );
}

export function RadioSelect<T extends z.ZodRawShape>({
  additionalClassName = "",
  errors,
  label,
  name,
  options,
  register,
  schema,
}: RadioSelectProps<T>) {
  const field = schema.shape[name as string];
  const isRequired = field && !field.isOptional?.() && !field.isNullable?.();
  const fieldError = errors[name as string];

  return (
    <div className="mb-4">
      {label && (
        <label className="block mb-2">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        className={`${styles.checkboxWrapper} ${styles[additionalClassName]}`}
      >
        {options.map((option, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              {...register(name)}
              id={`radio-${name as string}-${index}`}
              name={name as string}
              type="radio"
              value={option.id}
              className="mr-2"
            />
            <label
              htmlFor={`radio-${name as string}-${index}`}
              className="cursor-pointer"
            >
              {option.name}
            </label>
          </div>
        ))}
      </div>
      {fieldError && (
        <p className="text-red-500 text-sm mt-1">{fieldError.message}</p>
      )}
    </div>
  );
}

export const SubmitButton = ({
  disabled,
  children,
}: {
  disabled?: boolean;
  children: string;
}) => {
  return (
    <button
      type="submit"
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
};

export function GenericFieldWithLabel<T extends z.ZodRawShape>({
  allowNull = false,
  cols,
  errors,
  label,
  name,
  options,
  placeholder,
  register,
  rows,
  schema,
  type = "text",
}: FormFieldProps<T>) {
  const field = schema.shape[name as string];
  const isRequired = field && !field.isOptional?.() && !field.isNullable?.();
  const fieldError = errors[name as string];

  // Handle checkboxes and radio buttons through options with special types
  if (type === "checkbox" && options) {
    const checkboxOptions = Object.entries(options).map(([id, name]) => ({
      id,
      name,
    }));
    return (
      <Checkboxes
        additionalClassName=""
        errors={errors}
        label={label}
        name={name}
        options={checkboxOptions}
        register={register}
        schema={schema}
      />
    );
  }

  if (type === "radio" && options) {
    const radioOptions = Object.entries(options).map(([id, name]) => ({
      id,
      name,
    }));
    return (
      <RadioSelect
        additionalClassName=""
        errors={errors}
        label={label}
        name={name}
        options={radioOptions}
        register={register}
        schema={schema}
      />
    );
  }

  // Handle select dropdowns
  if (options) {
    return (
      <div className="mb-4">
        <label className="block mb-2">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <select
          {...register(name)}
          className={`w-full p-2 border rounded ${fieldError ? "border-red-500" : "border-gray-300"}`}
        >
          <option value="">Select {label}</option>
          {allowNull && <option value="">Select...</option>}
          {Object.entries(options).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
        {fieldError && (
          <p className="text-red-500 text-sm mt-1">{fieldError.message}</p>
        )}
      </div>
    );
  }

  // Handle textarea
  if (type === "textarea") {
    return (
      <div className="mb-4">
        <label className="block mb-2">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <textarea
          placeholder={placeholder}
          rows={rows || 3}
          cols={cols}
          {...register(name)}
          className={`w-full p-2 border rounded ${fieldError ? "border-red-500" : "border-gray-300"}`}
        />
        {fieldError && (
          <p className="text-red-500 text-sm mt-1">{fieldError.message}</p>
        )}
      </div>
    );
  }

  // Handle regular input fields
  return (
    <div className="mb-4">
      <label className="block mb-2">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={`w-full p-2 border rounded ${fieldError ? "border-red-500" : "border-gray-300"}`}
      />
      {fieldError && (
        <p className="text-red-500 text-sm mt-1">{fieldError.message}</p>
      )}
    </div>
  );
}

export function ToggleWithLabel<T extends z.ZodRawShape>({
  errors,
  label,
  name,
  register,
  schema,
}: ToggleProps<T>) {
  const field = schema.shape[name as string];
  const isRequired = field && !field.isOptional?.() && !field.isNullable?.();
  const fieldError = errors[name as string];
  return (
    <>
      <div className={styles.checkboxWithLabel}>
        <span>
          {label} {isRequired && <span style={{ color: "red" }}>*</span>}:
        </span>{" "}
        <span className={styles.attributeToggle}>
          <div
            className={`${styles.button} ${styles.r}`}
            id={`button-${field}`}
          >
            <input
              {...register(name)}
              className={styles.checkbox}
              type="checkbox"
            />
            <div className={styles.knobs}></div>
            <div className={styles.layer}></div>
          </div>
        </span>
      </div>
      {fieldError && (
        <p className="text-red-500 text-sm mt-1">{fieldError.message}</p>
      )}
    </>
  );
}

export const Url = ({ name }: { name: string }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };
  const validateUrl = () => {
    const urlRegex =
      /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
    if (!urlRegex.test(url)) {
      setError("Please enter a valid url");
    } else {
      setError("");
    }
  };

  useEffect(() => {
    validateUrl();
  }, [url]);

  return (
    <>
      <input
        autoFocus
        name={name}
        onChange={handleUrlChange}
        type="url"
        value={url}
      ></input>
      {error && (
        <div>
          {" "}
          <p className="error">{error}</p>
        </div>
      )}
    </>
  );
};
