import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors duration-150 ${
    isActive ? "text-white" : "text-muted hover:text-white"
  }`;

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-card/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-4xl items-center px-4">
        {/* Logo — left 1/3 */}
        <div className="flex-1">
          <Link to="/" className="flex items-center gap-2 select-none w-fit">
            <img
              src="/pitstoppd-logo.svg"
              alt="Pitstoppd"
              className="h-5 w-auto"
            />
            <span className="text-lg font-black tracking-normal text-f1-red">
              Pitstoppd
            </span>
          </Link>
        </div>

        {/* Navigation links — centered */}
        <div className="flex items-center gap-6">
          <NavLink to="/gps" className={navLinkClass}>
            Grands Prix
          </NavLink>
          <NavLink to="/pilotes" className={navLinkClass}>
            Drivers
          </NavLink>
          <NavLink to="/saisons" className={navLinkClass}>
            Seasons
          </NavLink>
        </div>

        {/* Auth — right 1/3 */}
        <div className="flex-1 flex items-center justify-end">
          {user && profile ? (
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              {/* Trigger button */}
              <button className="flex items-center gap-2 text-sm font-medium text-muted hover:text-white transition-colors">
                <div className="h-7 w-7 rounded-full bg-card-hover border border-line overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-subtle">
                      {profile.display_name[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <span>{profile.display_name}</span>
                <svg className="w-3 h-3 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full pt-2 w-44">
                  <div className="rounded-lg border border-line bg-card shadow-xl py-1">
                    <Link
                      to={`/${profile.username}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted hover:text-white hover:bg-card-hover transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted hover:text-white hover:bg-card-hover transition-colors"
                    >
                      Settings
                    </Link>
                    <div className="my-1 border-t border-line" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-subtle hover:text-white hover:bg-card-hover transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-muted hover:text-white transition-colors duration-150"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded bg-f1-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors duration-150"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
