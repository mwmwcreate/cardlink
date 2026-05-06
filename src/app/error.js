"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Application error:", error);
    // デプロイ直後のチャンク読み込みエラーなどの場合は自動でリロードを試みる
    const errorMsg = error?.message?.toLowerCase() || "";
    if (
      errorMsg.includes("fetch") ||
      errorMsg.includes("failed to load") ||
      errorMsg.includes("chunk") ||
      errorMsg.includes("network")
    ) {
      // 無限ループを防ぐため、セッションストレージでリロード回数を管理
      const reloaded = sessionStorage.getItem("app_reloaded_on_error");
      if (!reloaded) {
        sessionStorage.setItem("app_reloaded_on_error", "true");
        window.location.reload();
      } else {
        sessionStorage.removeItem("app_reloaded_on_error");
      }
    }
  }, [error]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#000", color: "#fff", padding: "20px", textAlign: "center" }}>
      <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>読み込みエラーが発生しました</h2>
      <p style={{ color: "#a1a1aa", marginBottom: "32px" }}>
        アプリが更新されたか、通信が不安定な可能性があります。<br />
        お手数ですが、再読み込みをお試しください。
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          padding: "12px 24px",
          backgroundColor: "#ffffff",
          color: "#000000",
          border: "none",
          borderRadius: "30px",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        再読み込みする
      </button>
    </div>
  );
}
