import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";
import { Alert } from "./ui/alert";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user);
        setLocation("/dashboard");
      } else {
        setError(data.error?.message || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <div className="mb-8 slide-up">
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-[-.055em] text-balance md:text-5xl">
          Log in
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-[1.5] text-[hsl(var(--muted-foreground))]">
          Access your saved schemes and applications.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        
        <label className="block text-sm font-bold">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 block w-full rounded-md border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm" />
        </label>
        
        <label className="block text-sm font-bold">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2 block w-full rounded-md border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm" />
        </label>

        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Logging in..." : "Log in"}</Button>
        <div className="text-center text-sm">
          <button type="button" onClick={() => setLocation("/register")} className="text-[hsl(var(--primary))] hover:underline">Create an account</button>
        </div>
      </form>
    </div>
  );
}

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user);
        setLocation("/dashboard");
      } else {
        setError(data.error?.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <div className="mb-8 slide-up">
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-[-.055em] text-balance md:text-5xl">
          Register
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-[1.5] text-[hsl(var(--muted-foreground))]">
          Create an account to save and track.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        
        <label className="block text-sm font-bold">
          Full Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-2 block w-full rounded-md border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm" />
        </label>

        <label className="block text-sm font-bold">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 block w-full rounded-md border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm" />
        </label>
        
        <label className="block text-sm font-bold">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-2 block w-full rounded-md border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm" />
        </label>

        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Register"}</Button>
        <div className="text-center text-sm">
          <button type="button" onClick={() => setLocation("/login")} className="text-[hsl(var(--primary))] hover:underline">Already have an account?</button>
        </div>
      </form>
    </div>
  );
}

import { useEffect } from "react";

export function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login?returnTo=" + encodeURIComponent(location));
    }
  }, [isLoading, user, location, setLocation]);

  if (isLoading) return <div className="p-10 text-center">Loading session...</div>;
  
  if (!user) {
    return null; // Will redirect via useEffect
  }
  
  return <Component {...rest} />;
}
