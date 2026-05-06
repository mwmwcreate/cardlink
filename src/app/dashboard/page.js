"use client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCard } from "@/lib/firestore";
import { getUser } from "@/lib/firestore";
import BusinessCard from "@/components/BusinessCard";
import "./dashboard.css";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [card, setCard] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingCard, setLoadingCard] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const cacheKey = `cardlink_dashboard_${user.uid}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { c, u } = JSON.parse(cached);
          setCard(c);
          setUserData(u);
          setLoadingCard(false);
        } catch (e) {}
      }

      Promise.all([getCard(user.uid), getUser(user.uid)])
        .then(([c, u]) => {
          setCard(c);
          setUserData(u);
          sessionStorage.setItem(cacheKey, JSON.stringify({ c, u }));
        })
        .finally(() => setLoadingCard(false));
    }
  }, [user]);

  if (loading || !user) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="container-narrow">
        {/* ヘッダー */}
        <div className="dashboard__header animate-fade-in">
          <h1 className="dashboard__greeting">
            WELCOME, {user.displayName || "GUEST"}
          </h1>
          <p className="dashboard__sub">CardLink ダッシュボード</p>
        </div>

        <div className="dashboard__grid">
          {/* 自分の名刺プレビュー */}
          <div className="dashboard__card-section animate-fade-in">
            <h2 className="dashboard__section-title" style={{ alignSelf: "flex-start" }}>あなたの名刺</h2>
            {loadingCard ? (
              <div className="dashboard__card-loading"><div className="spinner" /></div>
            ) : card ? (
              <div className="dashboard__card-preview">
                <BusinessCard card={card} size="large" />
                <button className="btn btn-secondary" onClick={() => router.push("/card/edit")}>
                  EDIT CARD
                </button>
              </div>
            ) : (
              <div className="dashboard__no-card">
                <p>まだ名刺を作成していません</p>
                <button className="btn btn-primary" onClick={() => router.push("/card/edit")}>
                  CREATE CARD
                </button>
              </div>
            )}
          </div>

          {/* クイックアクション */}
          <div className="dashboard__actions animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {[
              { icon: "01", title: "名刺を交換する", desc: "QRコードで名刺を交換", href: "/exchange", color: "purple" },
              { icon: "02", title: "コレクション", desc: "保存した名刺を見る", href: "/collection", color: "ocean" },
              { icon: "03", title: "公開プロフィール", desc: userData?.username ? `cardlink.vercel.app/u/${userData.username}` : "名刺を作成すると有効", href: userData?.username ? `/u/${userData.username}` : "/card/edit", color: "emerald" },
            ].map((action, i) => (
              <button
                key={i}
                className={`dashboard__action-card glass-card theme-${action.color}`}
                onClick={() => router.push(action.href)}
              >
                <span className="dashboard__action-icon" style={{ fontFamily: "var(--font-sans)", fontWeight: 800 }}>{action.icon}</span>
                <div>
                  <h3>{action.title}</h3>
                  <p>{action.desc}</p>
                </div>
                <span className="dashboard__action-arrow">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
