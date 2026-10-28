import { useState } from "react";
import { useNavigate } from "react-router";
import Button from "../components/Button.jsx";
import Icon, { LogoMark } from "../components/Icon.jsx";
import { PlotlineArt } from "../components/Illustrations.jsx";

const input =
  "min-h-12 w-full rounded-full border border-rule-strong bg-surface px-5 text-base transition-colors duration-150 hover:border-ink focus-visible:border-ink";

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
    <div className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-rows-none lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative flex flex-col justify-between gap-8 overflow-hidden bg-ink p-6 text-paper sm:p-10 lg:p-14" aria-hidden="true">
        <div className="relative z-10 flex items-center gap-2.5">
          <LogoMark size={32} className="text-paper [&_path]:stroke-ink [&_circle:last-child]:stroke-paper" />
          <span className="font-display text-2xl font-semibold tracking-tight">Plotline</span>
        </div>
        <PlotlineArt className="relative z-10 -mx-6 h-auto w-[calc(100%+3rem)] max-w-none max-lg:hidden sm:-mx-10 sm:w-[calc(100%+5rem)] lg:-mx-14 lg:w-[calc(100%+7rem)]" />
        <p className="relative z-10 max-w-sm font-display text-2xl leading-snug tracking-tight text-paper/90 max-lg:hidden">
          Every project is a line. Keep yours moving.
        </p>
      </aside>

      <main className="flex items-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="rise mx-auto w-full max-w-md">
          <h1 className="mb-8 text-4xl sm:text-5xl">Log in to Plotline</h1>
          <form onSubmit={submit} noValidate>
            {error && (
              <p role="alert" className="mb-5 flex items-center gap-2 rounded-box border border-danger bg-danger-soft px-4 py-3 text-sm font-medium text-danger-ink">
                <Icon name="alert" size={18} />
                {error}
              </p>
            )}
            <div className="mb-5">
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium">Email</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            </div>
            <div className="mb-8">
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium">Password</label>
              <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            </div>
            <Button type="submit" className="w-full min-h-12 text-base">Log in</Button>
          </form>
          <p className="mt-6 border-t border-rule pt-5 text-sm text-muted">
            Demo app: any email and password will work.
          </p>
        </div>
      </main>
    </div>
  );
}
