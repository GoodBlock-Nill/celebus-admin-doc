import { LangProvider } from "@/components/LangProvider";
import ConfigBoot from "@/components/ConfigBoot";
import AppShell from "@/components/AppShell";

export default function Page() {
  return (
    <LangProvider>
      <ConfigBoot>
        <main>
          <AppShell />
        </main>
      </ConfigBoot>
    </LangProvider>
  );
}
