"use client";

type SignInSectionProps = {
  isLoggedIn: boolean;
  authStatus: string;
  user: { email?: string } | null | undefined;
  login: () => void;
  logout: () => void;
};

export function SignInSection({
  isLoggedIn,
  authStatus,
  user,
  login,
  logout,
}: SignInSectionProps) {
  return (
    <section className="bg-white/10 rounded-xl p-6 mb-4 backdrop-blur">
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-cyan-400 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">
          0
        </span>
        <h2 className="text-lg font-semibold">Sign In</h2>
      </div>

      {!isLoggedIn ? (
        <div>
          <p className="text-slate-300 mb-4">
            Sign in to create a passkey-secured wallet
          </p>
          <button
            onClick={() => login()}
            disabled={authStatus === "in-progress"}
            className="bg-cyan-400 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-300 disabled:opacity-50 w-full"
          >
            {authStatus === "in-progress" ? "Signing in..." : "Sign In with Email"}
          </button>
        </div>
      ) : (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-400 font-semibold">✓ Signed In</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="text-sm text-slate-400 hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
