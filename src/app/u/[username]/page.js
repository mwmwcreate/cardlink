"use client";
import { useAuth } from "@/lib/auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCard, getUserByUsername, saveCardToCollection, isCardSaved } from "@/lib/firestore";
import BusinessCard from "@/components/BusinessCard";
import { XIcon, GitHubIcon, InstagramIcon } from "@/components/SocialIcons";
import "./profile.css";

export default function PublicProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [card, setCard] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (username) {
      getUserByUsername(username).then((u) => {
        setProfileUser(u);
        if (u) {
          getCard(u.id).then(setCard).finally(() => setLoadingCard(false));
        } else {
          setLoadingCard(false);
        }
      });
    }
  }, [username]);

  useEffect(() => {
    if (user && profileUser && user.uid !== profileUser.id) {
      isCardSaved(user.uid, profileUser.id).then(setSaved);
    }
  }, [user, profileUser]);

  const handleSave = async () => {
    if (!user) { router.push("/login"); return; }
    if (!profileUser) return;
    setSaving(true);
    try {
      await saveCardToCollection(user.uid, profileUser.id);
      setSaved(true);
      setToast({ msg: "名刺を保存しました！", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ msg: "保存に失敗しました", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loadingCard) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (!card || !profileUser) {
    return (
      <div className="page">
        <div className="container-narrow" style={{ textAlign: "center", paddingTop: "120px" }}>
          <h1 style={{ fontSize: "3rem", marginBottom: "16px", color: "var(--text-muted)" }}>404</h1>
          <h2>名刺が見つかりません</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
            このユーザー名の名刺は存在しないか、まだ作成されていません。
          </p>
          <button className="btn btn-primary" style={{ marginTop: "24px" }} onClick={() => router.push("/")}>
            トップへ戻る
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user && user.uid === profileUser.id;

  return (
    <div className="profile-page">
      <div className="profile-page__bg">
        <div className="profile-page__orb profile-page__orb--1" />
        <div className="profile-page__orb profile-page__orb--2" />
      </div>

      <div className="container-narrow profile-page__content">
        <div className="profile-page__card animate-fade-in-up">
          <BusinessCard card={card} size="large" />
        </div>

        {/* 詳細情報 */}
        <div className="profile-page__details glass-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="profile-page__detail-header">
            {card.iconURL && <img src={card.iconURL} alt="" className="profile-page__detail-icon" />}
            <div>
              <h2>{card.discordName}</h2>
              {card.discordId && <p className="profile-page__detail-id">@{card.discordId}</p>}
            </div>
          </div>

          {card.message && (
            <div className="profile-page__message-box">
              <p>「{card.message}」</p>
            </div>
          )}

          <div className="profile-page__info-grid">
            {card.occupation && (
              <div className="profile-page__info-item">
                <span className="profile-page__info-label">OCCUPATION</span>
                <span>{card.occupation}</span>
              </div>
            )}
            {(card.birthday || card.age) && (
              <div className="profile-page__info-item">
                <span className="profile-page__info-label">BIRTHDAY</span>
                <span>{card.birthday || card.age}</span>
              </div>
            )}
          </div>

          {card.tags && card.tags.length > 0 && (
            <div className="profile-page__tags">
              <span className="profile-page__info-label">TAGS</span>
              <div className="profile-page__tags-list">
                {card.tags.map((tag, i) => (
                  <span key={i} className="profile-page__tag">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* SNSリンク */}
          {(card.twitter || card.github || card.instagram) && (
            <div className="profile-page__socials">
              <span className="profile-page__info-label">SOCIALS</span>
              <div className="profile-page__socials-list">
                {card.twitter && (
                  <a href={`https://x.com/${card.twitter}`} target="_blank" rel="noopener noreferrer"
                    className="profile-page__social-link">
                    <XIcon size={16} /> @{card.twitter}
                  </a>
                )}
                {card.github && (
                  <a href={`https://github.com/${card.github}`} target="_blank" rel="noopener noreferrer"
                    className="profile-page__social-link">
                    <GitHubIcon size={16} /> {card.github}
                  </a>
                )}
                {card.instagram && (
                  <a href={`https://instagram.com/${card.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="profile-page__social-link">
                    <InstagramIcon size={16} /> @{card.instagram}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* アクション */}
        <div className="profile-page__actions animate-fade-in" style={{ animationDelay: "0.3s" }}>
          {isOwner ? (
            <button className="btn btn-secondary btn-lg" onClick={() => router.push("/card/edit")}>
              EDIT CARD
            </button>
          ) : saved ? (
            <button className="btn btn-secondary btn-lg" disabled>
              SAVED
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
              {saving ? "SAVING..." : "SAVE CARD"}
            </button>
          )}
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
