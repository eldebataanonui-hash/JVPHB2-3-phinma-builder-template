import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorText } from "@/lib/errors";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { logIn } from "@/app/auth/actions";

export default async function LogInPage(props: PageProps<"/login">) {
  const { error: errorCode, confirmed, next } = await props.searchParams;
  const error = errorText(errorCode);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={logIn} className="flex flex-col gap-4">
            {confirmed && (
              <p className="text-sm">Your email is confirmed. Log in to continue.</p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {typeof next === "string" && <input type="hidden" name="next" value={next} />}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" name="password" required />
            </div>
            <Button type="submit">Log in</Button>
            <p className="text-sm text-muted-foreground">
              New here?{" "}
              <Link
                href={typeof next === "string" ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
                className="underline"
              >
                Create an account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
