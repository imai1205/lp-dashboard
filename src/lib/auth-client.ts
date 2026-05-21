import { createAuthClient } from "better-auth/react";

// baseURL は明示しない。ブラウザでは window.location.origin が自動採用される。
// → dev で port が 3000 / 3001 のどちらでも、また本番のドメインでも同じコードで動く。
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
