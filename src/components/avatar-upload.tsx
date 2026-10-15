"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { removeAvatar, setAvatar } from "@/app/profile/actions";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 2 * 1024 * 1024;

// "Change picture" on your own profile. The file goes straight from your
// browser to your own folder in Supabase Storage (the storage rules only
// allow your folder), then the profile is updated to point at it.
export function AvatarUpload({ userId, hasPicture }: { userId: string; hasPicture: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file: File) {
    const ext = TYPES[file.type];
    if (!ext) return setMessage("Please choose a JPG, PNG or WebP picture.");
    if (file.size > MAX_BYTES) return setMessage("Please choose a picture under 2 MB.");

    setBusy(true);
    setMessage("");
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await createClient()
      .storage.from("avatars")
      .upload(path, file, { contentType: file.type });

    if (error) {
      setBusy(false);
      return setMessage("Upload failed. Please try again.");
    }

    const result = await setAvatar(path);
    setBusy(false);
    if (!result.ok) {
      // Don't leave an unused file behind in storage.
      await createClient().storage.from("avatars").remove([path]);
      return setMessage("Couldn't save your picture. Please try again.");
    }
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    await removeAvatar();
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
          <Camera className="h-4 w-4" />
          {busy ? "Saving…" : "Change picture"}
        </Button>
        {hasPicture && (
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={remove}>
            Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP, up to 2 MB. Never upload your ID or your account&apos;s
        login screens.
      </p>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
