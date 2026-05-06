import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "CardLink - デジタル名刺交換",
  description: "デジタル名刺を作成し、QRコードで簡単に交換・保存できるプラットフォーム",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
