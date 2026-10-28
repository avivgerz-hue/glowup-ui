import { useState } from "react";
import { useNavigate } from "react-router";
import Button from "../components/Button.jsx";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    navigate("/");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Log in to Plotline</h1>
      <form onSubmit={submit} noValidate>
        {error && <p role="alert" className="text-red-600 mb-2">{error}</p>}
        <div className="mb-2">
          <label htmlFor="login-email">Email</label>
          <br />
          <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-gray-400 p-1" />
        </div>
        <div className="mb-4">
          <label htmlFor="login-password">Password</label>
          <br />
          <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-gray-400 p-1" />
        </div>
        <Button type="submit">Log in</Button>
      </form>
      <p className="mt-4 text-sm">
        Demo app: any email and password will work.
      </p>
    </div>
  );
}
