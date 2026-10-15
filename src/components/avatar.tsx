import { cn } from "@/lib/utils";

// Builds the public address of a picture in the "avatars" bucket.
// Only paths the database accepted (your-id/123.jpg) are ever stored.
export function avatarUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

// A trader's picture, or the first letter of their name if they haven't
// added one.
export function Avatar({
  name,
  path,
  size = 40,
  className,
}: {
  name: string;
  path?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };

  if (path) {
    return (
      // A plain <img>: the picture is already small, and Supabase serves it.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl(path)}
        // The name is always shown next to the picture, so screen readers
        // don't need it twice.
        alt=""
        style={style}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-border", className)}
      />
    );
  }

  return (
    <span
      style={{ ...style, fontSize: size * 0.45 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/20 font-[family-name:var(--font-display)] font-bold text-primary",
        className,
      )}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
