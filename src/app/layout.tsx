import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NorgeFly | Flight Lookup Norway",
  description: "Search and track flight schedules, time zones, starting locations, and arrival details for flights departing from or arriving in Norway.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
