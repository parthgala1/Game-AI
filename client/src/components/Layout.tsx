import React from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Gamepad, Settings, Home, Layers, User } from "lucide-react";
import StarField from "./StarField";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isGamePage = location.pathname === "/game";
  const userData = JSON.parse(localStorage.getItem("userData"));

  return (
    <div className="min-h-screen flex flex-col">
      <StarField />

      {!isGamePage && (
        <header className="p-4 border-b border-space-neon-green/30">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-pixel neon-text">
                COSMOS AI
              </h1>
            </Link>

            <nav className="hidden md:flex gap-8">
              <NavLink to="/" icon={<Home size={18} />} label="Home" />
              {userData.userName && (
                <>
                  <NavLink
                    to="/game"
                    icon={<Gamepad size={18} />}
                    label="Play"
                  />
                  <NavLink
                    to="/levels"
                    icon={<Layers size={18} />}
                    label="Levels"
                  />
                  <NavLink
                    to="/settings"
                    icon={<Settings size={18} />}
                    label="Settings"
                  />
                </>
              )}
              {!userData.userName ? (
                <NavLink to="/login" icon={<User size={18} />} label="Login" />
              ) : (
                <div className="relative group">
                  <img
                    src={userData.profileImageUrl}
                    className="h-10 w-10 rounded-full border-2 border-space-neon-green/50 object-cover transition-all duration-300 group-hover:border-space-neon-green group-hover:shadow-neon"
                    alt="Profile"
                  />
                  <div className="absolute inset-0 rounded-full bg-space-neon-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -inset-1 rounded-full bg-space-neon-green/20 blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                </div>
              )}
            </nav>

            <div className="flex md:hidden">
              <MobileMenu />
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>

      {!isGamePage && (
        <footer className="p-4 border-t border-space-neon-green/30 text-center text-sm text-gray-400">
          <div className="container mx-auto">
            <p>© 2025 Cosmos AI - A Space Invaders Saga</p>
          </div>
        </footer>
      )}
    </div>
  );
};

const NavLink = ({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 ${
        isActive
          ? "neon-text border border-space-neon-green/50 bg-space-neon-green/10"
          : "text-gray-400 hover:text-white hover:bg-space-medium/50"
      }`}
    >
      {icon}
      <span className="font-future">{label}</span>
    </Link>
  );
};

const MobileMenu = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-white"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span
            className={`w-full h-0.5 bg-current transition-all duration-300 ${
              isOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`w-full h-0.5 bg-current transition-all duration-300 ${
              isOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`w-full h-0.5 bg-current transition-all duration-300 ${
              isOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-space-medium border border-space-neon-green/30 rounded-md shadow-lg z-50">
          <div className="py-2">
            <Link
              to="/"
              className="block px-4 py-2 text-white hover:bg-space-light"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2">
                <Home size={16} />
                <span>Home</span>
              </div>
            </Link>
            <Link
              to="/game"
              className="block px-4 py-2 text-white hover:bg-space-light"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2">
                <Gamepad size={16} />
                <span>Play</span>
              </div>
            </Link>
            <Link
              to="/levels"
              className="block px-4 py-2 text-white hover:bg-space-light"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2">
                <Layers size={16} />
                <span>Levels</span>
              </div>
            </Link>
            <Link
              to="/settings"
              className="block px-4 py-2 text-white hover:bg-space-light"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2">
                <Settings size={16} />
                <span>Settings</span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
