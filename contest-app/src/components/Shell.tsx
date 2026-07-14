"use client";

import { LangProvider } from "./LangProvider";
import Header from "./Header";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">{children}</main>
    </LangProvider>
  );
}
