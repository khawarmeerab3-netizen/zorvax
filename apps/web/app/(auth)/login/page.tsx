import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { Card, CardTitle } from '@/components/ui/Card';

export default function LoginPage() {
  return (
    <section className="container-page flex max-w-md flex-col py-16">
      <Card>
        <CardTitle className="mb-1 text-2xl">Welcome back</CardTitle>
        <p className="mb-6 text-sm text-slate-400">Lyra has been keeping your chart warm.</p>
        <AuthForm mode="login" />
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-primary-400 hover:text-primary-500">
            Forgot password?
          </Link>
          <Link href="/register" className="text-slate-400 hover:text-white">
            New here? Sign up
          </Link>
        </div>
      </Card>
    </section>
  );
}
