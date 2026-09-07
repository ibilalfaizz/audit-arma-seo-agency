"use client";

import { useState, useTransition } from "react";
import { login, LoginState } from "./actions";
import styles from "./login.module.css";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await login(null, formData);
      setState(result);
    });
  };

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>ARMA Admin</h1>
        <p className={styles.subtitle}>Partner links — sign in to continue.</p>

        {state?.error && <div className={styles.error}>{state.error}</div>}

        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={styles.input}
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
        />

        <button className={styles.button} type="submit" disabled={isPending}>
          {isPending ? "Checking..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
