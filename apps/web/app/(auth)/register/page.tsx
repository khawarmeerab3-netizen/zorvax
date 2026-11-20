import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { Card, CardTitle } from '@/components/ui/Card';

export default function RegisterPage() {
  return (
    <section className="container-page flex max-w-md flex-col py-16">
      <Card>
        <CardTitle className="mb-1 text-2xl">Create your account</CardTitle>
        <p className="mb-6 text-sm text-slate-400">Your chart — and Lyra — are waiting.</p>
        <AuthForm mode="register" />
        <p className="mt-4 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-400 hover:text-primary-500">
            Log in
          </Link>
        </p>
      </Card>
    </section>
  );
}
