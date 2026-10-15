import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errorText } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createDeal } from "@/app/deals/actions";

export default async function NewDealPage(props: PageProps<"/deals/new">) {
  const error = errorText((await props.searchParams).error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/deals/new");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>New Deal</CardTitle>
          <CardDescription>
            Describe the MLBB account you&apos;re selling. You&apos;ll get a
            link to send to your buyer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createDeal} className="flex flex-col gap-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required maxLength={80} placeholder="Mythic account, 120 skins" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" maxLength={1000} rows={5} placeholder="Rank, rare skins, heroes, emblems" />
              <p className="text-xs text-destructive">
                Never put your password, login email or any code here.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Price (₱)</Label>
              <Input id="price" name="price" type="number" required min={1} max={10000000} step={1} />
            </div>
            <Button type="submit">Create Deal Room</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
