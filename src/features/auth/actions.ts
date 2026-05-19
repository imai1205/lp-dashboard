"use server";

// TODO: メール+パスワード / マジックリンク / OAuth 等のサインインアクション。

export async function signIn(_email: string, _password: string): Promise<void> {
  throw new Error("signIn: not implemented");
}

export async function signUp(
  _email: string,
  _password: string,
  _name?: string,
): Promise<void> {
  throw new Error("signUp: not implemented");
}

export async function signOut(): Promise<void> {
  throw new Error("signOut: not implemented");
}
