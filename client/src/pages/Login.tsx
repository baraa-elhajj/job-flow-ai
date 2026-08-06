import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/authContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Login() {
  const { loginWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination =
    (location.state as { from?: string } | null)?.from ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate(destination, { replace: true });
    }
  }, [destination, loading, user, navigate]);

  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    if (!credentialResponse.credential) {
      setError("Google did not return a credential. Please try again.");
      return;
    }

    setSigningIn(true);
    setError(null);
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate(destination, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gruvbox-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="job-card p-6 sm:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gruvbox-fg0 mb-2">
              JobFlow AI
            </h1>
            <p className="text-gruvbox-fg2">Sign in to continue</p>
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            {signingIn ? (
              <div className="flex items-center gap-2 text-gruvbox-fg3 py-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing you in…</span>
              </div>
            ) : (
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setError("Google sign-in was cancelled or failed.")
                }
              />
            )}

            {error && (
              <p className="text-sm text-gruvbox-red text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
