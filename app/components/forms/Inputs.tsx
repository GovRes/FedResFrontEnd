import React, { ChangeEvent, useEffect, useState } from "react";

export const SubmitButton = ({
  children,
}: {
  type: string;
  children: string;
}) => {
  return <button type="submit">{children}</button>;
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
        className="invalid:bg-red-200 invalid:text-red-800"
        name={name}
        onChange={handleEmailChange}
        type="email"
        value={email}
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

export const Text = ({ name }: { name: string }) => {
  return <input autoFocus name={name} type="text" />;
};

export const TextArea = ({ name }: { name: string }) => {
  return <textarea autoFocus cols={100} name={name} rows={30} />;
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
        className="invalid:bg-red-200 invalid:text-red-800"
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
