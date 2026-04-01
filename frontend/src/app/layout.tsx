import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATS Resume Screener | AI-Powered Resume Analysis",
  description:
    "Evaluate your resume against job descriptions with our ATS-style screening tool. Get match scores, missing skills analysis, and improvement suggestions.",
  keywords: "ATS, resume screener, resume analysis, job matching, applicant tracking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
