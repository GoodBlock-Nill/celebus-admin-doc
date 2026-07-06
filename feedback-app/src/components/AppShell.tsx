"use client";

import { LangProvider } from "./LangProvider";
import Header from "./Header";
import Board from "./Board";

export default function AppShell() {
  return (
    <LangProvider>
      <Header />
      <Board />
    </LangProvider>
  );
}
