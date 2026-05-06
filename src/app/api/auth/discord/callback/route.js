import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Firebase Admin SDK Initialization
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines for Vercel env var parsing
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

export async function GET(request) {
  const { searchParams, origin, protocol, host } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Vercel等の環境では origin が正しくない場合があるため protocol と host から生成
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}//${host}`;
  const redirectUri = `${baseUrl}/api/auth/discord/callback`;

  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=discord_auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=no_code`);
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Discord token exchange failed:", tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=discord_token_failed`);
    }

    // 2. Fetch user profile from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();
    if (!userResponse.ok) {
      console.error("Discord user fetch failed:", userData);
      return NextResponse.redirect(`${baseUrl}/login?error=discord_user_failed`);
    }

    // userData contains id, username, global_name, avatar
    const discordId = userData.id;
    // global_name (表示名) を優先し、設定されていなければ username (ID) を使う
    const discordUsername = userData.global_name || userData.username;
    const discordAvatar = userData.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordId}/${userData.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/0.png`; // デフォルトアバター

    // 3. Create Custom Token in Firebase
    const uid = `discord:${discordId}`;
    const db = admin.firestore();
    
    // データベースにDiscordの情報を保存しておく (名刺作成時の初期値用)
    const userRef = db.collection("users").doc(uid);
    await userRef.set({
      discordId: userData.username, // xxxxx 形式のID
      discordName: discordUsername, // 表示名
      iconURL: discordAvatar,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Firebaseログイン用のカスタムトークンを発行
    const customToken = await admin.auth().createCustomToken(uid);

    // 4. トークンをURLパラメーターに付与してログイン画面へリダイレクト
    return NextResponse.redirect(`${baseUrl}/login?token=${customToken}`);

  } catch (err) {
    console.error("Discord OAuth Error:", err);
    return NextResponse.redirect(`${baseUrl}/login?error=server_error`);
  }
}
