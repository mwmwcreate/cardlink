"use client";
import { useAuth, signInWithGoogle } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import "./login.css";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
      return;
    }

    // URLパラメーターからtokenを取得してログイン処理
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      alert("Discordログインに失敗しました。");
      window.history.replaceState({}, document.title, "/login");
    } else if (token) {
      signInWithCustomToken(auth, token)
        .then(() => {
          window.history.replaceState({}, document.title, "/login");
          router.push("/dashboard");
        })
        .catch((err) => {
          console.error("Custom token error:", err);
          alert("ログイン処理中にエラーが発生しました。");
          window.history.replaceState({}, document.title, "/login");
        });
    }
  }, [user, loading, router]);

  const handleDiscordLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/discord/callback`);
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;
    window.location.href = discordAuthUrl;
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="login-page">
      <div className="login-page__bg">
        <div className="login-page__orb login-page__orb--1" />
        <div className="login-page__orb login-page__orb--2" />
      </div>
      <div className="login-card glass-card">
        <div className="login-card__icon">💎</div>
        <h1 className="login-card__title">CardLink</h1>
        <p className="login-card__desc">デジタル名刺交換プラットフォーム</p>
        <button className="login-card__discord-btn" onClick={handleDiscordLogin} id="discord-login-btn">
          <svg viewBox="0 0 127.14 96.36" width="24" height="24">
            <path fill="#ffffff" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.58,67.58,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
          Discordでログイン
        </button>
        <p className="login-card__footer">ログインすると名刺の作成・交換ができます</p>
      </div>
    </div>
  );
}
