import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // CELEBUS 본앱 API(인증/개인 응답)는 절대 캐시 금지 — 개발팀 요구사항 (첫 매칭 우선)
    { matcher: ({ url }) => url.hostname === "api.client.celebus.xyz", handler: new NetworkOnly() },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
