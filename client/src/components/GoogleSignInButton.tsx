import { useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import GoogleIcon from "./icons/GoogleIcon";

interface GoogleSignInButtonProps {
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError?: () => void;
  disabled?: boolean;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState(320);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const width = Math.floor(container.getBoundingClientRect().width);
      setButtonWidth(Math.max(240, Math.min(width, 400)));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`group relative w-full max-w-sm ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <div
        className="flex items-center justify-center gap-3 w-full py-3.5 px-5 rounded-xl border-2 border-gruvbox-bg3 bg-gruvbox-bg0_h dark:bg-gruvbox-bg1 font-semibold text-gruvbox-fg0 shadow-sm transition-all duration-200 group-hover:border-gruvbox-orange/60 group-hover:shadow-md group-active:scale-[0.99]"
        aria-hidden="true"
      >
        <GoogleIcon />
        <span className="text-[15px] tracking-tight">Continue with Google</span>
      </div>

      {!disabled && (
        <div
          className="absolute inset-0 z-10 opacity-[0.011] overflow-hidden rounded-xl cursor-pointer [&_iframe]:!w-full [&_iframe]:!h-full [&>div]:!w-full [&>div]:!h-full [&>div]:!min-h-full"
          title="Continue with Google"
        >
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            useOneTap={false}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width={buttonWidth}
          />
        </div>
      )}
    </div>
  );
}
