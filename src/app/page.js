"use client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import "./landing.css";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing__hero">
        <div className="landing__hero-bg">
          <div className="landing__orb landing__orb--1" />
          <div className="landing__orb landing__orb--2" />
          <div className="landing__orb landing__orb--3" />
        </div>
        <div className="container landing__hero-content">
          <div className="landing__badge">DIGITAL BUSINESS CARD</div>
          <h1 className="landing__title">
            名刺交換を、
            <br />
            <span className="landing__title-accent">もっとカジュアル</span>に。
          </h1>
          <p className="landing__subtitle">
            CardLinkで自分だけのデジタル名刺を作成。
            <br />
            QRコードで簡単に交換&保存。
          </p>
          <div className="landing__actions">
            <button className="btn btn-primary btn-lg" onClick={() => router.push("/login")}>
              無料で始める →
            </button>
          </div>
        </div>

        {/* カードプレビュー */}
        <div className="landing__preview">
          <div className="landing__card-demo theme-purple">
            <div className="landing__card-inner">
              <div className="landing__card-avatar">Y</div>
              <div>
                <div className="landing__card-name">Yuta</div>
                <div className="landing__card-id">@yuta_dev</div>
              </div>
            </div>
            <div className="landing__card-msg">「一緒にものづくりしよう！」</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing__features">
        <div className="container">
          <h2 className="landing__section-title">主な機能</h2>
          <div className="landing__features-grid">
            {[
              { icon: "01", title: "名刺作成", desc: "Discord情報・アイコン・職業・メッセージを入力して自分だけの名刺を作成" },
              { icon: "02", title: "QR交換", desc: "QRコードを見せるだけで簡単に名刺交換。カメラで読み取りもOK" },
              { icon: "03", title: "コレクション", desc: "交換した名刺を保存・管理。いつでも確認できる" },
              { icon: "04", title: "公開プロフィール", desc: "URLを共有するだけで名刺を見てもらえる" },
            ].map((f, i) => (
              <div key={i} className="landing__feature-card glass-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="landing__feature-icon" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, color: "var(--accent-primary)" }}>{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <p>© 2026 CardLink. All rights reserved.</p>
      </footer>
    </div>
  );
}
