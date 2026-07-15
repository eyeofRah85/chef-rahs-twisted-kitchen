import { LoginForm } from "@/components/auth/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{
    passwordChanged?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { passwordChanged } = await searchParams;

  return <LoginForm passwordChanged={passwordChanged === "1"} />;
}
