import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SearchUsers from "./SearchUsers";
import Icon from "./Icon";
import Avatar from "./Avatar";

const NAV = [
  { to: "/gps", label: "Grands Prix" },
  { to: "/pilotes", label: "Drivers" },
  { to: "/saisons", label: "Seasons" },
];

const desktopLink = ({ isActive }) =>
  `relative py-1 text-sm font-medium transition-colors duration-150 after:absolute after:inset-x-0 after:-bottom-[17px] after:h-0.5 after:rounded-full after:transition-colors ${
    isActive ? "text-white after:bg-f1-red" : "text-muted hover:text-white after:bg-transparent"
  }`;

const mobileLink = ({ isActive }) =>
  `flex-1 py-2.5 text-center text-sm font-medium border-b-2 transition-colors ${
    isActive ? "text-white border-f1-red" : "text-muted border-transparent"
  }`;

function UserMenu({ profile, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted hover:text-white hover:bg-card-hover transition-colors";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 text-sm font-medium text-muted hover:text-white hover:bg-card-hover transition-colors cursor-pointer"
      >
        <Avatar profile={profile} className="h-7 w-7 text-xs" />
        <span className="hidden sm:block max-w-32 truncate">{profile.display_name}</span>
        <Icon name="chevronDown" className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" onClick={() => setOpen(false)} className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-line-strong bg-card p-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.7)] origin-top-right animate-[menu-in_160ms_var(--ease-out)]">
          <div className="px-3 py-2 border-b border-line mb-1">
            <p className="text-sm font-semibold text-white truncate">{profile.display_name}</p>
            <p className="text-xs text-subtle truncate">@{profile.username}</p>
          </div>
          <Link role="menuitem" to={`/${profile.username}`} className={item}>
            <Icon name="user" /> Profile
          </Link>
          <Link role="menuitem" to="/settings" className={item}>
            <Icon name="settings" /> Settings
          </Link>
          <button role="menuitem" onClick={onSignOut} className={`${item} w-full cursor-pointer`}>
            <Icon name="logout" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-page/85 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <div className="flex-1 min-w-0">
          <Link to="/" className="flex items-center gap-2 select-none w-fit" aria-label="Pitstoppd home">
            <img src="/pitstoppd-logo.svg" alt="" className="h-5 w-auto" />
            <span className="font-display text-[22px] font-bold tracking-[-0.03em] text-f1-red leading-none">
              pitstoppd
            </span>
          </Link>
        </div>

        <div className={`hidden md:flex items-center gap-7 ${searchOpen ? "invisible" : ""}`}>
          {NAV.map((n) => <NavLink key={n.to} to={n.to} className={desktopLink}>{n.label}</NavLink>)}
        </div>

        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
          <SearchUsers onOpenChange={setSearchOpen} />
          {!searchOpen && (
            user && profile ? (
              <UserMenu profile={profile} onSignOut={handleSignOut} />
            ) : (
              <>
                <Link to="/login" className="whitespace-nowrap text-sm font-medium text-muted hover:text-white transition-colors px-1">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </>
            )
          )}
        </div>
      </nav>

      <div className="md:hidden flex border-t border-line px-2">
        {NAV.map((n) => <NavLink key={n.to} to={n.to} className={mobileLink}>{n.label}</NavLink>)}
      </div>
    </header>
  );
}
