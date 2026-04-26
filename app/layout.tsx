import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roast My Resume — The Internet's Brutally Honest AI Resume Roast",
  description:
    "Upload your resume and get brutally roasted by AI. Find out how cooked you are and climb the leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
