import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorText } from "@/lib/errors";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { safeNextPath } from "@/lib/safe-path";
import { signUp } from "@/app/auth/actions";

export default async function SignUpPage(props: PageProps<"/signup">) {
  const { error: errorCode, sent, next: nextRaw } = await props.searchParams;
  const error = errorText(errorCode);
  // Where to go once confirmed (e.g. Join a deal). Only paths on this site.
  const next = safeNextPath(typeof nextRaw === "string" ? nextRaw : "");
  const loginHref = next === "/profile" ? "/login" : `/login?next=${encodeURIComponent(next)}`;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create your trader account</CardTitle>
          <CardDescription>
            You&apos;ll need to confirm your email before you can trade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm">
              Check your email and click the confirmation link. Then come
              back and <Link href={loginHref} className="underline">log in</Link>.
            </p>
          ) : (
            <form action={signUp} className="flex flex-col gap-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <input type="hidden" name="next" value={next} />
              <div className="flex flex-col gap-2">
                <Label htmlFor="display_name">Display name</Label>
                <Input id="display_name" name="display_name" required maxLength={40} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput id="password" name="password" required minLength={6} />
              </div>
              <Button type="submit">Sign up</Button>
              <p className="text-sm text-muted-foreground">
                Already have an account? <Link href={loginHref} className="underline">Log in</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
