import React, { ChangeEvent, useEffect, useState } from "react";
import styles from "./forms.module.css";

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
export const Checkboxes = ({
  additionalClassName,
  options,
}: {
  additionalClassName: string;
  options: { id: number | string; name: string }[];
}) => {
  const [checkedState, setCheckedState] = useState(
    new Array(options.length).fill(false)
  );

  const handleOnChange = (position: number) => {
    const updatedCheckedState = checkedState.map((item, index) =>
      index === position ? !item : item
    );

    setCheckedState(updatedCheckedState);
  };
  return (
    <div className={`${styles.checkboxWrapper} ${styles[additionalClassName]}`}>
      {options.map((option, index) => (
        <div key={index}>
          <input
            id={`checkbox-${index}`}
            name={option.name}
            type="checkbox"
            value={option.id}
            checked={checkedState[index]}
            onChange={() => handleOnChange(index)}
          />
          <label htmlFor={`checkbox-${index}`}>{option.name}</label>
        </div>
      ))}
    </div>
  );
};
export const Email = ({ name }: { name: string }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };
  const validateEmail = () => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
    } else {
      setError("");
    }
  };

  useEffect(() => {
    validateEmail();
  }, [email]);

  return (
    <>
      <input
        autoFocus
        name={name}
        onChange={handleEmailChange}
        type="email"
        value={email}
      ></input>
      {error && (
        <div>
          {" "}
          <p>{error}</p>
        </div>
      )}
    </>
  );
};
export const Number = ({
  name,
  onChange,
  value,
}: {
  name: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  value: number | undefined;
}) => {
  return <input name={name} type="number" onChange={onChange} value={value} />;
};
export const NumberWithLabel = ({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  value: number | undefined;
}) => {
  return (
    <span>
      {label}: <Number name={name} onChange={onChange} value={value} />
    </span>
  );
};
export const RadioSelect = ({
  additionalClassName,
  name,
  options,
}: {
  additionalClassName: string;
  name: string;
  options: { id: number | string; name: string }[];
}) => {
  const [checkedState, setCheckedState] = useState(
    new Array(options.length).fill(false)
  );

  const handleOnChange = (position: number) => {
    const updatedCheckedState = checkedState.map((item, index) =>
      index === position ? !item : item
    );
    setCheckedState(updatedCheckedState);
  };
  return (
    <div className={`${styles.checkboxWrapper} ${styles[additionalClassName]}`}>
      {options.map((option, index) => (
        <div key={index}>
          <input
            id={`radio-${index}`}
            name={name}
            type="radio"
            value={option.id}
            onChange={() => handleOnChange(index)}
          />
          <label htmlFor={`radio-${index}`}>{option.name}</label>
        </div>
      ))}
    </div>
  );
};
export const Select = ({
  allowNull = false,
  name,
  options,
  onChange,
  value,
}: {
  allowNull?: boolean;
  name: string;
  options: Record<string, string>;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  value: string | number | undefined;
}) => {
  return (
    <select defaultValue={value} name={name} onChange={onChange}>
      {allowNull && <option value="">Select...</option>}
      {Object.keys(options).map((key) => {
        return (
          <option key={key} value={key}>
            {options[key]}
          </option>
        );
      })}
    </select>
  );
};
export const SelectWithLabel = ({
  allowNull = false,
  label,
  name,
  options,
  onChange,
  value,
}: {
  allowNull?: boolean;
  label: string;
  name: string;
  options: Record<string, string>;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  value: string | number | undefined;
}) => {
  return (
    <div>
      <span>{label}</span>:{" "}
      <Select
        allowNull={allowNull}
        name={name}
        options={options}
        onChange={onChange}
        value={value}
      />
    </div>
  );
};
export const SubmitButton = ({
  children,
}: {
  type: string;
  children: string;
}) => {
  return <button type="submit">{children}</button>;
};
export const Text = ({
  name,
  onChange,
  value,
}: {
  name: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  value: string | undefined;
}) => {
  return <input name={name} type="text" onChange={onChange} value={value} />;
};
export const TextWithLabel = ({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  value: string | undefined;
}) => {
  return (
    <div>
      <div>{label}:</div> <Text name={name} onChange={onChange} value={value} />
    </div>
  );
};

export const TextArea = ({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string | undefined;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}) => {
  return (
    <textarea
      autoFocus
      cols={100}
      name={name}
      rows={30}
      value={value}
      onChange={onChange}
    />
  );
};

export const TextAreaWithLabel = ({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  value: string | undefined;
}) => {
  return (
    <div>
      <div>{label}:</div>

      <TextArea name={name} value={value} onChange={onChange} />
    </div>
  );
};
export const ToggleWithLabel = ({
  label,
  checked,
  onChange,
  name,
}: {
  label: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}) => {
  return (
    <div className={styles.checkboxWithLabel}>
      <span>{label}:</span>{" "}
      <Toggle checked={checked} name={name} onChange={onChange} />
    </div>
  );
};
export const Toggle = ({
  checked,
  onChange,
  name,
}: {
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}) => {
  return (
    <span className={styles.attributeToggle}>
      <div className={`${styles.button} ${styles.r}`} id="button-1">
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={checked}
          name={name}
          onChange={onChange}
        />
        <div className={styles.knobs}></div>
        <div className={styles.layer}></div>
      </div>
    </span>
  );
};
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
