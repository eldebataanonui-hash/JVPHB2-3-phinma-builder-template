# 13 — Profile pictures

**What to build:** Traders can add a profile picture from their device.
Once saved, it appears on their Profile, on Find traders cards, in
Messages and next to their name in the top bar.

**Blocked by:** 11, 12

**Status:** done

- [x] An "avatars" Storage bucket: JPG, PNG or WebP only, 2 MB max
- [x] Storage rules: traders may only upload to and delete from their own
      folder
- [x] `profiles.avatar_path` only accepts a path inside the trader's own
      folder; traders may update only bio and avatar_path
- [x] Change picture and Remove on your own Profile, with a warning not
      to upload IDs or login screens
- [x] Pictures show on Profile, Find traders cards, Messages and the top
      bar; traders without one keep the letter avatar
- [x] The database change is saved as a numbered SQL file
- [x] Works on the live URL
