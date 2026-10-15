# 17 — Social media on profiles

**What to build:** Traders can add optional Facebook, Instagram, TikTok,
X, YouTube and Discord usernames on their Profile. Anyone viewing the
Profile sees them as links, so they can check the trader is a real,
established person.

**Blocked by:** 11

**Status:** todo

- [ ] Six optional username columns on `profiles`; the database only
      accepts plain usernames (no slashes or colons)
- [ ] Traders can update only their own social usernames (plus bio and
      picture), nothing else
- [ ] The app builds every link itself, always to the real site; Discord
      shows as text
- [ ] Pasting a full profile link or "@name" keeps just the username
- [ ] Profiles show the links with a note to keep payment talk and
      payments inside a Deal Room
- [ ] The database change is saved as a numbered SQL file
- [ ] Works on the live URL
