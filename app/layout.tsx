import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Inter, Great_Vibes} from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

// const pinyonScript = Pinyon_Script({
//   subsets: ["latin"],
//   variable: "--font-script",
//   weight: "400",
// });

// const rochester = Rochester({
//   subsets: ["latin"],
//   variable: "--font-script",
//   weight: "400",
// });

// const italianno = Italianno({
//   subsets: ["latin"],
//   variable: "--font-script",
//   weight: "400",
// });

// const lavishlyYours = Lavishly_Yours({
//   subsets: ["latin"],
//   variable: "--font-script",
//   weight: "400",
// });

// const berkeleySwash = Berkshire_Swash({
//   subsets: ["latin"],
//   variable: "--font-script",
//   weight: "400",
// });

// const monsieurLaDoulaise = Monsieur_La_Doulaise({
//   subsets: ["latin"],
//   variable: "--font-script",
//   weight: "400",
// });

// const tangerine = Tangerine({
//   subsets: ["latin"],
//   variable: "--font-script",
//   weight: "400",
// });

// const parisienne = Parisienne({
//   subsets: ["latin"],
//   variable: "--font-script",
//   weight: "400",
// });

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-script",
  weight: "400",
});

// const allura = Allura({
//   subsets: ["latin"],
//   variable: "--font-script",
//   weight: "400",
// });

// const sacramento = Sacramento({
//   subsets: ["latin"],
//   variable: "--font-script",
//   weight: "400",
// });

// const alexBrush = Alex_Brush({
//   subsets: ["latin"],
//   variable: "--font-script",
//   weight: "400",
// });

export const metadata: Metadata = {
  title: "Chef Rah's Twisted Kitchen",
  description: "Custom ordering website for Chef Rah's Twisted Kitchen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${greatVibes.variable} antialiased`}>
        <AuthProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
