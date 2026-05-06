import { useState, useRef } from "react";
import "./BusinessCard.css";
import { XIcon, GitHubIcon, InstagramIcon } from "./SocialIcons";

const THEMES = {
  purple: "theme-purple",
  ocean: "theme-ocean",
  sunset: "theme-sunset",
  emerald: "theme-emerald",
  rose: "theme-rose",
  midnight: "theme-midnight",
};

export default function BusinessCard({ card, size = "normal", onClick }) {
  const themeClass = THEMES[card?.theme] || THEMES.purple;
  
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = (e) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // マウス位置から傾きを計算（最大15度）
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    
    // 反射（グレア）の位置を計算
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    
    setRotation({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY, opacity: 0.15 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  const cardStyle = isHovered ? {
    transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.02, 1.02, 1.02)`,
    transition: 'none',
  } : {
    transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    transition: 'transform 0.5s ease',
  };

  return (
    <div
      ref={cardRef}
      className={`business-card-wrapper business-card-wrapper--${size}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
    >
      <div className={`business-card-inner ${isFlipped ? "is-flipped" : ""}`}>
        
        {/* ================= 表面 (FRONT) ================= */}
        <div className={`business-card business-card-front ${themeClass}`}>
          {/* 反射（グレア）エフェクト */}
          <div 
            className="business-card__glare" 
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8), transparent 40%)`,
              opacity: glare.opacity,
              transition: isHovered ? 'none' : 'opacity 0.5s ease',
            }} 
          />

          {/* 装飾 */}
          <div className="business-card__decoration">
            <div className="business-card__circle business-card__circle--1" />
            <div className="business-card__circle business-card__circle--2" />
          </div>

          <div className="business-card__content">
            <div className="business-card__header">
              {/* メイン情報 */}
              <div className="business-card__info">
                <h3 className="business-card__name" style={card?.discordName && card.discordName.length > 10 ? { fontSize: "var(--font-size-lg)" } : {}}>
                  {card?.discordName || "名前未設定"}
                </h3>
                {card?.discordId && <p className="business-card__discord-id">@{card.discordId}</p>}
              </div>

              {/* アイコン */}
              <div className="business-card__icon-wrapper">
                {card?.iconURL ? (
                  <img src={card.iconURL} alt={card.discordName || "アイコン"} className="business-card__icon" />
                ) : (
                  <div className="business-card__icon-placeholder">
                    {(card?.discordName || "?")[0]}
                  </div>
                )}
              </div>
            </div>

            {/* サブ情報 */}
            {(card?.occupation || card?.birthday || card?.age) && (
              <div className="business-card__details">
                {card?.occupation && <span>OCCUPATION: {card.occupation}</span>}
                {(card?.birthday || card?.age) && <span>BIRTHDAY: {card.birthday || card.age}</span>}
              </div>
            )}

            {/* カスタムタグ */}
            {card?.tags && card.tags.length > 0 && (
              <div className="business-card__tags">
                {card.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="business-card__custom-tag" title={`#${tag}`}>#{tag}</span>
                ))}
                {card.tags.length > 3 && (
                  <span className="business-card__custom-tag">+{card.tags.length - 3}</span>
                )}
              </div>
            )}

            {/* メッセージ */}
            {card?.message && (
              <div className="business-card__message">
                <p>「{card.message}」</p>
              </div>
            )}
          </div>

          {/* フリップボタン（表面） */}
          <button className="business-card__flip-btn" onClick={handleFlip} aria-label="Flip card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          {/* CardLinkロゴ */}
          <div className="business-card__brand">CardLink</div>
        </div>


        {/* ================= 裏面 (BACK) ================= */}
        <div className={`business-card business-card-back ${themeClass}`}>
          <div className="business-card__glare" style={{
            background: `radial-gradient(circle at ${100 - glare.x}% ${glare.y}%, rgba(255,255,255,0.8), transparent 40%)`,
            opacity: glare.opacity,
            transition: isHovered ? 'none' : 'opacity 0.5s ease',
          }} />

          {/* 装飾 */}
          <div className="business-card__decoration">
            <div className="business-card__circle business-card__circle--1" />
            <div className="business-card__circle business-card__circle--2" />
          </div>

          <div className="business-card__content business-card__content--back">
            <h3 className="business-card__back-title">SOCIAL LINKS</h3>
            
            {(card?.twitter || card?.github || card?.instagram) ? (
              <div className="business-card__socials-large">
                {card.twitter && (
                  <a href={`https://x.com/${card.twitter}`} target="_blank" rel="noopener noreferrer" className="business-card__social-link" onClick={e => e.stopPropagation()}>
                    <XIcon size={20} color="#f0f0f5" />
                    <span>@{card.twitter}</span>
                  </a>
                )}
                {card.github && (
                  <a href={`https://github.com/${card.github}`} target="_blank" rel="noopener noreferrer" className="business-card__social-link" onClick={e => e.stopPropagation()}>
                    <GitHubIcon size={20} color="#f0f0f5" />
                    <span>{card.github}</span>
                  </a>
                )}
                {card.instagram && (
                  <a href={`https://instagram.com/${card.instagram}`} target="_blank" rel="noopener noreferrer" className="business-card__social-link" onClick={e => e.stopPropagation()}>
                    <InstagramIcon size={20} />
                    <span>@{card.instagram}</span>
                  </a>
                )}
              </div>
            ) : (
              <p className="business-card__no-socials">SNS links not set.</p>
            )}
          </div>

          {/* フリップボタン（裏面） */}
          <button className="business-card__flip-btn" onClick={handleFlip} aria-label="Flip card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
          
          <div className="business-card__brand">CardLink</div>
        </div>

      </div>
    </div>
  );
}
