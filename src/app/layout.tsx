export const runtime = 'edge';
import type { Metadata } from "next";
import { Cinzel, EB_Garamond, Cinzel_Decorative, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ACRÓPOLE — Plataforma de Estudos & Conhecimento",
  description: "Um templo do saber unindo a disciplina clássica à potência da tecnologia moderna. Biblioteca, flashcards, mapas mentais e tutor com IA.",
  keywords: ["estudos", "plataforma educacional", "flashcards", "acrópole", "aprendizado"],
  manifest: "/manifest.json",
  openGraph: {
    title: "ACRÓPOLE — Templo do Saber",
    description: "Plataforma de estudos inspirada na sabedoria clássica.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${cinzel.variable} ${ebGaramond.variable} ${cinzelDecorative.variable} ${inter.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
