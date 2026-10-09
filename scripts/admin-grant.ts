import bcrypt from "bcryptjs";

import { db } from "../src/lib/db";

function emailArg() {
  const index = process.argv.indexOf("--email");
  const email = index >= 0 ? process.argv[index + 1]?.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    console.error("Usage: npm run admin:grant -- --email name@makina.se");
    process.exitCode = 1;
    return null;
  }
  return email;
}

function askHidden(prompt: string) {
  return new Promise<string>((resolve) => {
    const chars: string[] = [];
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    const onData = (chunk: string) => {
      if (chunk === "\n" || chunk === "\r" || chunk === "\u0004") {
        process.stdin.setRawMode?.(false);
        process.stdin.pause();
        process.stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(chars.join(""));
        return;
      }
      if (chunk === "\u0003") process.exit(1);
      if (chunk === "\u007f" || chunk === "\b") {
        chars.pop();
        return;
      }
      chars.push(chunk);
    };
    process.stdin.on("data", onData);
  });
}

async function main() {
  const email = emailArg();
  if (!email) return;
  const password = await askHidden("Password (min 12 characters): ");
  const confirm = await askHidden("Repeat password: ");
  if (password.length < 12 || password !== confirm) {
    console.error("Password was not accepted.");
    process.exitCode = 1;
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", passwordHash, deletedAt: null },
    });
    console.log(`Upgraded ${email} to ADMIN.`);
  } else {
    const local = email.split("@")[0] || "Admin";
    await db.user.create({
      data: {
        email,
        role: "ADMIN",
        passwordHash,
        firstName: local,
        lastName: "Makina",
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`Created ADMIN ${email}.`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "admin grant failed");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
