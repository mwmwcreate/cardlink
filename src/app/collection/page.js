"use client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getCollection, removeFromCollection, updateCardNote } from "@/lib/firestore";
import BusinessCard from "@/components/BusinessCard";
import "./collection.css";

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function CollectionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const cacheKey = `cardlink_collection_${user.uid}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          // キャッシュがあれば即時表示
          setCards(JSON.parse(cached));
          setLoadingCards(false);
        } catch (e) {}
      }

      // 裏側で最新データを取得して更新
      getCollection(user.uid)
        .then((data) => {
          setCards(data);
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        })
        .finally(() => setLoadingCards(false));
    }
  }, [user]);

  // 全タグを収集（重複除去 + 使用回数カウント）
  const allTags = useMemo(() => {
    const tagCount = {};
    cards.forEach((c) => {
      (c.card.tags || []).forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [cards]);

  const handleRemove = async (cardOwnerUid) => {
    if (!user) return;
    try {
      await removeFromCollection(user.uid, cardOwnerUid);
      setCards((prev) => prev.filter((c) => c.cardOwnerUid !== cardOwnerUid));
      setToast({ msg: "名刺を削除しました", type: "success" });
      setTimeout(() => setToast(null), 3000);
      
      // キャッシュも更新
      const cacheKey = `cardlink_collection_${user.uid}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        sessionStorage.setItem(cacheKey, JSON.stringify(parsed.filter(c => c.cardOwnerUid !== cardOwnerUid)));
      }
    } catch {
      setToast({ msg: "削除に失敗しました", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSaveMemo = async (cardOwnerUid, note) => {
    if (!user) return;
    try {
      await updateCardNote(user.uid, cardOwnerUid, note);
      setCards((prev) => prev.map((c) => c.cardOwnerUid === cardOwnerUid ? { ...c, note } : c));
      setToast({ msg: "メモを保存しました", type: "success" });
      setTimeout(() => setToast(null), 3000);
      
      // キャッシュも更新
      const cacheKey = `cardlink_collection_${user.uid}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        sessionStorage.setItem(cacheKey, JSON.stringify(parsed.map((c) => c.cardOwnerUid === cardOwnerUid ? { ...c, note } : c)));
      }
    } catch {
      setToast({ msg: "メモの保存に失敗しました", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filtered = cards.filter((c) => {
    const card = c.card;
    // タグフィルター
    if (selectedTag && !(card.tags || []).includes(selectedTag)) return false;
    // テキスト検索
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      card.discordName?.toLowerCase().includes(s) ||
      card.discordId?.toLowerCase().includes(s) ||
      card.occupation?.toLowerCase().includes(s) ||
      (card.tags || []).some((t) => t.toLowerCase().includes(s))
    );
  });

  if (loading || !user) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-fade-in">
          <h1 className="page-title">コレクション</h1>
          <p className="page-subtitle">交換した名刺一覧（{cards.length}枚）</p>
        </div>

        {/* 検索 */}
        <div className="collection__search animate-fade-in">
          <input
            className="form-input"
            placeholder="名前・ID・タグで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* タグフィルター */}
        {allTags.length > 0 && (
          <div className="collection__tags animate-fade-in">
            <button
              className={`collection__tag-btn ${!selectedTag ? "collection__tag-btn--active" : ""}`}
              onClick={() => setSelectedTag("")}
            >
              すべて
            </button>
            {allTags.map(({ tag, count }) => (
              <button
                key={tag}
                className={`collection__tag-btn ${selectedTag === tag ? "collection__tag-btn--active" : ""}`}
                onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
              >
                #{tag} <span className="collection__tag-count">{count}</span>
              </button>
            ))}
          </div>
        )}

        {loadingCards ? (
          <div className="collection__loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="collection__empty glass-card animate-fade-in">
            <span className="collection__empty-icon">CARDLINK</span>
            <h3>{search || selectedTag ? "検索結果がありません" : "まだ名刺がありません"}</h3>
            <p>{search || selectedTag ? "別のキーワードやタグで検索してください" : "名刺を交換して保存しましょう"}</p>
            {!search && !selectedTag && (
              <button className="btn btn-primary" onClick={() => router.push("/exchange")}>
                名刺を交換する
              </button>
            )}
          </div>
        ) : (
          <div className="collection__grid">
            {filtered.map((item, i) => (
              <div key={item.id} className="collection__item animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <BusinessCard
                  card={item.card}
                  size="normal"
                  onClick={() => router.push(`/u/${item.ownerUsername}`)}
                  memo={item.note || ""}
                  isEditableMemo={true}
                  onSaveMemo={(newNote) => {
                    if (newNote !== item.note) {
                      handleSaveMemo(item.cardOwnerUid, newNote);
                    }
                  }}
                />
                <div className="collection__item-meta">
                  <span className="collection__item-date">
                    SAVED ON: {formatDate(item.savedAt)}
                  </span>
                </div>
                <div className="collection__item-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/u/${item.ownerUsername}`)}>
                    詳細を見る
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemove(item.cardOwnerUid)}>
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
