"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 2 * 1024 * 1024;

// "Add photos" for the seller. Files go straight from the browser into
// this deal's folder; the storage rules only allow the deal's seller,
// and at most 4 photos.
export function DealPhotoUpload({ dealId, remaining }: { dealId: string; remaining: number }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(files: File[]) {
    const chosen = files.slice(0, remaining);
    for (const file of chosen) {
      if (!TYPES[file.type]) return setMessage("Please choose JPG, PNG or WebP pictures.");
      if (file.size > MAX_BYTES) return setMessage("Each picture must be under 2 MB.");
    }

    setBusy(true);
    setMessage("");
    const supabase = createClient();
    for (const [i, file] of chosen.entries()) {
      const path = `${dealId}/${Date.now()}${i}.${TYPES[file.type]}`;
      const { error } = await supabase.storage
        .from("deal-photos")
        .upload(path, file, { contentType: file.type });
      if (error) {
        setMessage("Some photos couldn't be uploaded. Please try again.");
        break;
      }
    }
    setBusy(false);
    if (files.length > remaining) setMessage(`Only ${remaining} more photo(s) fit; the rest were skipped.`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) upload(files);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <ImagePlus className="h-4 w-4" />
        {busy ? "Uploading…" : `Add photos (${remaining} left)`}
      </Button>
      <p className="text-xs text-muted-foreground">
        Rank, skins, heroes. Crop out emails, phone numbers and account IDs
        first. JPG, PNG or WebP, up to 2 MB each.
      </p>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
