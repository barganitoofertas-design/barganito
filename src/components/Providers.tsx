import { SessionProvider } from "next-auth/react";
import ServiceWorkerRegister from "./Notifications/ServiceWorkerRegister";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ServiceWorkerRegister />
      {children}
    </SessionProvider>
  );
}
