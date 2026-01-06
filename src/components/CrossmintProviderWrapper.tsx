"use client";

import {
  CrossmintProvider,
  CrossmintAuthProvider,
} from "@crossmint/client-sdk-react-ui";
import { ReactNode } from "react";

export function CrossmintProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <CrossmintProvider apiKey={process.env.NEXT_PUBLIC_CROSSMINT_API_KEY!}>
      <CrossmintAuthProvider loginMethods={["email", "google"]}>
        {children}
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}
