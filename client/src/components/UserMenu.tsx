import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import type { AuthUser } from "../types/auth";

interface UserMenuProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    void onLogout();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full ring-2 ring-transparent hover:ring-gruvbox-orange/40 focus:outline-none focus:ring-gruvbox-orange transition"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-9 h-9 rounded-full border border-gruvbox-bg3 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gruvbox-orange text-white flex items-center justify-center text-sm font-bold border border-gruvbox-bg3">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-gruvbox-bg3 bg-gruvbox-bg1 shadow-lg overflow-hidden z-[60]"
        >
          <div className="px-4 py-3 border-b border-gruvbox-bg3 bg-gruvbox-bg0_h/50 dark:bg-gruvbox-bg2/30">
            <p className="text-sm font-semibold text-gruvbox-fg0 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gruvbox-fg4 truncate mt-0.5">
              {user.email}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gruvbox-fg2 hover:bg-gruvbox-bg2 hover:text-gruvbox-red transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
