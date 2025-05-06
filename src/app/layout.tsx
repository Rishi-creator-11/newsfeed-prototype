import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "NewsFeed Prototype",
  description: "Social‑style news aggregator",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    /* remove the className="dark" if you don't want global dark mode */
    <html lang="en" className="">
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 antialiased">
        {children}
      </body>
    </html>
  );
}
