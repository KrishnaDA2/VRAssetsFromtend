
import React, { useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  AlertCircle,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';

interface LoginModalProps {
  isOpen: boolean;
  onSuccess: (user?: any) => void | Promise<void>;
  connectionStatus: 'connected' | 'unauthorized' | 'offline';
}

const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onSuccess,
  connectionStatus,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      errors.username = 'Username is required';
    } else if (normalizedUsername.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (normalizedUsername.length > 100) {
      errors.username = 'Username cannot exceed 100 characters';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // Sends Username + Password to POST /api/v1/auth/login.
      const result = await api.login(normalizedUsername, password);

      if (!result.success) {
        setError(
          result.message || 'Login failed. Please check your credentials.'
        );
        return;
      }

      const user = result.user;

      const userId =
        user?.id ??
        user?.Id ??
        user?.userId ??
        user?.UserId ??
        user?.user_id ??
        user?.UserID;

      if (typeof userId !== 'string' || !GUID_PATTERN.test(userId)) {
        console.error(
          'Login succeeded but response did not include a valid user GUID:',
          user
        );

        setError(
          'Login response is missing a valid user ID. Check the backend LoginResponse DTO.'
        );
        return;
      }

      await onSuccess({
        ...user,
        id: userId,
        name:
          user?.name ??
          user?.Name ??
          user?.fullName ??
          user?.FullName ??
          normalizedUsername,
        username:
          user?.username ??
          user?.Username ??
          normalizedUsername,
        email: user?.email ?? user?.Email ?? '',
        role:
          user?.role ??
          user?.Role ??
          user?.globalRole ??
          user?.GlobalRole ??
          user?.global_role ??
          '',
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unexpected error during login.'
      );
    } finally {
      setLoading(false);
    }
  };

  const statusIsOffline = connectionStatus === 'offline';

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-sky-50 text-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-cyan-100" />

      <div className="absolute -left-24 -top-28 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl" />

      <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-cyan-300/40 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-2 lg:px-12">
        {/* Welcome message */}
        <section className="hidden lg:block">
          <div className="max-w-lg">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
              <Layers className="h-6 w-6 text-white" />
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              VR Asset Management
            </h1>

            <p className="mt-4 text-lg text-slate-700">
              Manage your virtual reality assets with ease and efficiency.
              Sign in to access your personalized dashboard and tools.
            </p>
          </div>
        </section>
        {/* Login form */}
        <section className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/10 sm:p-10">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
                <Layers className="h-6 w-6 text-white" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
                VR Asset Management
              </p>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">
              Welcome Back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in with your assigned username and password.
            </p>

            {error && (
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-username"
                  className="block text-sm font-medium text-slate-700"
                >
                  Username <span className="text-red-500">*</span>
                </label>

                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={100}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      username: '',
                    }));
                  }}
                  placeholder="Enter your username"
                  aria-invalid={Boolean(fieldErrors.username)}
                  aria-describedby={
                    fieldErrors.username ? 'username-error' : undefined
                  }
                  className={`w-full rounded-lg border bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    fieldErrors.username
                      ? 'border-red-400 focus:ring-red-100'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />

                {fieldErrors.username && (
                  <p id="username-error" className="text-xs text-red-600">
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: '',
                      }));
                    }}
                    placeholder="Enter your password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={
                      fieldErrors.password ? 'password-error' : undefined
                    }
                    className={`w-full rounded-lg border bg-white px-3 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                      fieldErrors.password
                        ? 'border-red-400 focus:ring-red-100'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPw((value) => !value)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                  >
                    {showPw ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {fieldErrors.password && (
                  <p id="password-error" className="text-xs text-red-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || statusIsOffline}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span
                className={`inline-flex items-center gap-1.5 ${
                  statusIsOffline ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {statusIsOffline ? (
                  <WifiOff className="h-3.5 w-3.5" />
                ) : (
                  <Wifi className="h-3.5 w-3.5" />
                )}

                {statusIsOffline ? 'Backend offline' : 'Secure sign-in'}
              </span>

              <span>Individual account credentials</span>
            </div>

            {statusIsOffline && (
              <p className="mt-3 text-center text-xs text-amber-700">
                Start the .NET API and SQL Server to sign in.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
