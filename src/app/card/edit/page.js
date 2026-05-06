"use client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getCard, saveCard, getUser, updateUsername } from "@/lib/firestore";
import { uploadProfileImage } from "@/lib/storage";
import BusinessCard from "@/components/BusinessCard";
import { XIcon, GitHubIcon, InstagramIcon } from "@/components/SocialIcons";
import "./edit.css";

const THEMES = ["purple", "ocean", "sunset", "emerald", "rose", "midnight"];
const THEME_LABELS = {
  purple: "パープル", ocean: "オーシャン", sunset: "サンセット",
  emerald: "エメラルド", rose: "ローズ", midnight: "ミッドナイト",
};

export default function CardEditPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    discordName: "", discordId: "", occupation: "",
    birthday: "", message: "", theme: "purple", iconURL: "", tags: [],
    twitter: "", github: "", instagram: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // 1. キャッシュがあれば即時反映（Dashboardのキャッシュを利用）
      const cacheKey = `cardlink_dashboard_${user.uid}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { c, u } = JSON.parse(cached);
          const defaultName = u?.discordName || "";
          const defaultId = u?.discordId || "";
          const defaultIcon = u?.iconURL || "";

          setForm({
            discordName: c?.discordName || defaultName,
            discordId: c?.discordId || defaultId,
            occupation: c?.occupation || "",
            birthday: c?.birthday || c?.age || "",
            message: c?.message || "",
            theme: c?.theme || "purple",
            iconURL: c?.iconURL || defaultIcon,
            tags: c?.tags || [],
            twitter: c?.twitter || "",
            github: c?.github || "",
            instagram: c?.instagram || "",
          });
          if (u) setUsername(u.username || defaultId || "");
          setIsFetching(false);
        } catch (e) {}
      }

      // 2. 裏側で最新データを取得
      Promise.all([getCard(user.uid), getUser(user.uid)]).then(([c, u]) => {
        const defaultName = u?.discordName || "";
        const defaultId = u?.discordId || "";
        const defaultIcon = u?.iconURL || "";

        setForm({
          discordName: c?.discordName || defaultName,
          discordId: c?.discordId || defaultId,
          occupation: c?.occupation || "",
          birthday: c?.birthday || c?.age || "",
          message: c?.message || "",
          theme: c?.theme || "purple",
          iconURL: c?.iconURL || defaultIcon,
          tags: c?.tags || [],
          twitter: c?.twitter || "",
          github: c?.github || "",
          instagram: c?.instagram || "",
        });

        if (u) setUsername(u.username || defaultId || "");
        
        // キャッシュも最新化
        sessionStorage.setItem(cacheKey, JSON.stringify({ c, u }));
      }).finally(() => {
        setIsFetching(false);
      });
    }
  }, [user]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadProfileImage(user.uid, file);
      handleChange("iconURL", url);
      showToast("アイコンをアップロードしました");
    } catch (err) {
      showToast("アップロードに失敗しました", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveCard(user.uid, form);
      if (username) await updateUsername(user.uid, username);
      showToast("名刺を保存しました！");
      
      // 保存時にキャッシュも更新してDashboardですぐ反映されるようにする
      const cacheKey = `cardlink_dashboard_${user.uid}`;
      const cached = sessionStorage.getItem(cacheKey);
      let newU = {};
      if (cached) {
        try { newU = JSON.parse(cached).u; } catch (e) {}
      }
      // 最新のユーザー名(username)などを反映
      if (username) newU.username = username;
      sessionStorage.setItem(cacheKey, JSON.stringify({ c: form, u: newU }));
      
    } catch (err) {
      showToast(err.message || "保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || isFetching || !user) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-fade-in">
          <h1 className="page-title">名刺を編集</h1>
          <p className="page-subtitle">あなたの情報を入力してオリジナル名刺を作成</p>
        </div>

        <div className="edit__layout">
          {/* フォーム */}
          <div className="edit__form glass-card animate-fade-in">
            {/* アイコン */}
            <div className="edit__icon-section">
              <div className="edit__icon-preview" onClick={() => fileInputRef.current?.click()}>
                {form.iconURL ? (
                  <img src={form.iconURL} alt="アイコン" />
                ) : (
                  <span className="edit__icon-placeholder">
                    {uploading ? "UPLOADING..." : "UPLOAD"}
                  </span>
                )}
                <div className="edit__icon-overlay">変更</div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} hidden />
              <p className="edit__icon-hint">クリックしてアイコンを設定</p>
            </div>

            {/* フィールド */}
            <div className="edit__fields">
              <div className="form-group">
                <label className="form-label">Discord 表示名 *</label>
                <input className="form-input" placeholder="例: Yuta" value={form.discordName}
                  onChange={(e) => handleChange("discordName", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Discord ユーザーID *</label>
                <input className="form-input" placeholder="例: yuta_dev" value={form.discordId}
                  onChange={(e) => handleChange("discordId", e.target.value)} />
              </div>
              <div className="edit__row">
                <div className="form-group">
                  <label className="form-label">職業</label>
                  <input className="form-input" placeholder="例: エンジニア" value={form.occupation}
                    onChange={(e) => handleChange("occupation", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">誕生日</label>
                  <input className="form-input" placeholder="例: 1月1日" value={form.birthday}
                    onChange={(e) => handleChange("birthday", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">みんなへの一言メッセージ</label>
                <textarea className="form-input form-textarea" placeholder="例: 一緒にものづくりしよう！"
                  value={form.message} onChange={(e) => handleChange("message", e.target.value)} />
              </div>

              {/* SNSリンク */}
              <div className="edit__sns-section">
                <label className="form-label">SOCIAL ACCOUNTS (OPTIONAL)</label>
                <div className="edit__sns-fields">
                  <div className="edit__sns-field">
                    <span className="edit__sns-icon"><XIcon size={18} color="#f0f0f5" /></span>
                    <input className="form-input" placeholder="Twitter/X ユーザーID" value={form.twitter}
                      onChange={(e) => handleChange("twitter", e.target.value)} />
                  </div>
                  <div className="edit__sns-field">
                    <span className="edit__sns-icon"><GitHubIcon size={18} color="#f0f0f5" /></span>
                    <input className="form-input" placeholder="GitHub ユーザーID" value={form.github}
                      onChange={(e) => handleChange("github", e.target.value)} />
                  </div>
                  <div className="edit__sns-field">
                    <span className="edit__sns-icon"><InstagramIcon size={18} /></span>
                    <input className="form-input" placeholder="Instagram ユーザーID" value={form.instagram}
                      onChange={(e) => handleChange("instagram", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">タグ（興味・スキルなど）</label>
                <div className="edit__tags-input-wrapper">
                  <input className="form-input" placeholder="例: #AI, #Web3 (Enterで追加)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const rawTag = tagInput.trim();
                        // 先頭の#を取り除く
                        const tag = rawTag.startsWith("#") ? rawTag.slice(1).trim() : rawTag;
                        if (tag && !form.tags.includes(tag)) {
                          handleChange("tags", [...form.tags, tag]);
                        }
                        setTagInput("");
                      }
                    }} />
                </div>
                {form.tags.length > 0 && (
                  <div className="edit__tags-list">
                    {form.tags.map((tag, i) => (
                      <span key={i} className="edit__tag-chip">
                        #{tag}
                        <button className="edit__tag-remove" onClick={() => {
                          handleChange("tags", form.tags.filter((_, idx) => idx !== i));
                        }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">ユーザー名（公開URL用） *</label>
                <input className="form-input" placeholder="例: yuta" value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} />
                {username ? (
                  <p className="edit__url-hint">公開URL: cardlink.vercel.app/u/{username}</p>
                ) : (
                  <p className="edit__url-hint" style={{color: "var(--color-sunset)"}}>※QRコードを表示するために必須です</p>
                )}
              </div>
            </div>

            {/* テーマ選択 */}
            <div className="edit__themes">
              <label className="form-label">カラーテーマ</label>
              <div className="edit__theme-grid">
                {THEMES.map((t) => (
                  <button key={t} className={`edit__theme-btn theme-${t} ${form.theme === t ? "edit__theme-btn--active" : ""}`}
                    onClick={() => handleChange("theme", t)}>
                    <div className="edit__theme-swatch" />
                    <span>{THEME_LABELS[t]}</span>
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-lg edit__save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "SAVING..." : "SAVE CARD"}
            </button>
          </div>

          {/* プレビュー */}
          <div className="edit__preview animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h3 className="edit__preview-title">プレビュー</h3>
            <div className="edit__preview-card">
              <BusinessCard card={form} size="large" />
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
