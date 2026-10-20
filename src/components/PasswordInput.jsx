import { useState } from "react";

function PasswordInput(props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        {...props}
        type={visible ? "text" : "password"}
      />

      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export default PasswordInput;
