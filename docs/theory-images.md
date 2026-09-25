# Theory images

Put one WebP file in `public/theory/` for each question that needs a picture.

The file name is the question id from `prisma/theory-bank.json`, with a `.webp` extension.

Example: question `P3-151` uses `public/theory/P3-151.webp`.

The app requests it as `/theory/P3-151.webp`. If the file is missing, the question still shows, with the note “Bild saknas” instead of a broken image.
