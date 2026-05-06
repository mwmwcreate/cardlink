"use client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getUser } from "@/lib/firestore";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import "./exchange.css";

export default function ExchangePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("show"); // "show" | "scan"
  const [username, setUsername] = useState("");
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getUser(user.uid).then((u) => {
        if (u) setUsername(u.username || "");
      });
    }
  }, [user]);

  // スキャナーのクリーンアップ
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/u/${username}`
    : "";

  const startScanner = async () => {
    if (!scannerRef.current) return;
    setScanning(true);
    try {
      const html5Qr = new Html5Qrcode("qr-reader");
      html5QrRef.current = html5Qr;
      await html5Qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          html5Qr.stop().catch(() => {});
          setScanning(false);
          // URLからパスを抽出してリダイレクト
          try {
            const url = new URL(decodedText);
            router.push(url.pathname);
          } catch {
            // URLでなければそのまま使用
            if (decodedText.startsWith("/")) {
              router.push(decodedText);
            }
          }
        },
        () => {} // エラーは無視（スキャン中は常に発生）
      );
    } catch (err) {
      console.error("カメラ起動エラー:", err);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  if (loading || !user) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="container-narrow">
        <div className="page-header animate-fade-in">
          <h1 className="page-title">名刺を交換</h1>
          <p className="page-subtitle">QRコードで簡単に名刺交換</p>
        </div>

        {/* タブ */}
        <div className="exchange__tabs animate-fade-in">
          <button className={`exchange__tab ${tab === "show" ? "exchange__tab--active" : ""}`}
            onClick={() => { setTab("show"); stopScanner(); }}>
            SHOW QR
          </button>
          <button className={`exchange__tab ${tab === "scan" ? "exchange__tab--active" : ""}`}
            onClick={() => setTab("scan")}>
            SCAN QR
          </button>
        </div>

        {/* QR表示 */}
        {tab === "show" && (
          <div className="exchange__show glass-card animate-fade-in">
            {username ? (
              <>
                <div className="exchange__qr-wrapper">
                  <QRCodeSVG
                    value={profileUrl}
                    size={240}
                    bgColor="transparent"
                    fgColor="#f0f0f5"
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="exchange__qr-label">このQRコードを相手に見せてスキャンしてもらいましょう</p>
                <div className="exchange__url-box">
                  <code>{profileUrl}</code>
                  <button className="btn btn-sm btn-secondary"
                    onClick={() => { navigator.clipboard.writeText(profileUrl); }}>
                    コピー
                  </button>
                </div>
              </>
            ) : (
              <div className="exchange__no-card">
                <p>まず名刺を作成してください</p>
                <button className="btn btn-primary" onClick={() => router.push("/card/edit")}>
                  名刺を作成
                </button>
              </div>
            )}
          </div>
        )}

        {/* QRスキャン */}
        {tab === "scan" && (
          <div className="exchange__scan glass-card animate-fade-in">
            <div id="qr-reader" ref={scannerRef} className="exchange__scanner" />
            {!scanning ? (
              <button className="btn btn-primary btn-lg" onClick={startScanner}>
                START CAMERA
              </button>
            ) : (
              <button className="btn btn-secondary btn-lg" onClick={stopScanner}>
                STOP SCANNER
              </button>
            )}
            <p className="exchange__scan-hint">相手のQRコードにカメラを向けてください</p>
          </div>
        )}
      </div>
    </div>
  );
}
