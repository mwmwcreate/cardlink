"use client";
import { useAuth, signOut } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import "./Navbar.css";

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ランディングページ・ログインページではNavbar非表示
  if (!user || pathname === "/" || pathname === "/login") return null;

  const navItems = [
    { href: "/dashboard", label: "HOME" },
    { href: "/card/edit", label: "EDIT" },
    { href: "/exchange", label: "EXCHANGE" },
    { href: "/collection", label: "COLLECTION" },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <button className="navbar__logo" onClick={() => router.push("/dashboard")}>
          <span className="navbar__logo-text">CARDLINK</span>
        </button>

        <div className="navbar__links">
          {navItems.map((item) => (
            <button
              key={item.href}
              className={`navbar__link ${pathname === item.href ? "navbar__link--active" : ""}`}
              onClick={() => router.push(item.href)}
            >
              <span className="navbar__link-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="navbar__actions">
          {user?.photoURL && (
            <img src={user.photoURL} alt="" className="navbar__avatar" />
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
            SIGN OUT
          </button>
        </div>
      </div>

      {/* モバイルボトムナビ */}
      <div className="navbar__mobile">
        {navItems.map((item) => (
          <button
            key={item.href}
            className={`navbar__mobile-link ${pathname === item.href ? "navbar__mobile-link--active" : ""}`}
            onClick={() => router.push(item.href)}
          >
            <span className="navbar__mobile-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
