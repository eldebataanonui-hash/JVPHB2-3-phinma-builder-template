# 17 — Social media on profiles

**What to build:** Traders can add optional Facebook, TikTok, Instagram,
X and Discord usernames on their Profile. Anyone viewing the
Profile sees them as links, so they can check the trader is a real,
established person.

**Blocked by:** 11

**Status:** done

- [x] Six optional username columns on `profiles`; the database only
      accepts plain usernames (no slashes or colons)
- [x] Traders can update only their own social usernames (plus bio and
      picture), nothing else
- [x] The app builds every link itself, always to the real site; Discord
      shows as text
- [x] Pasting a full profile link or "@name" keeps just the username
- [x] Your own Profile shows a Test link under each saved account
- [x] Profiles show the links with a note to keep payment talk and
      payments inside a Deal Room
- [x] The database change is saved as a numbered SQL file
- [x] Works on the live URL
