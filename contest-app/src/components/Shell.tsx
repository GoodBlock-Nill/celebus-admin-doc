"use client";

import { LangProvider } from "./LangProvider";
import Header from "./Header";
import Footer from "./Footer";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-6 pt-4">{children}</main>
      <Footer />
    </LangProvider>
  );
}
