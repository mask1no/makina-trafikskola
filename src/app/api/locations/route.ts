import { z } from "zod";

import { invalidInput } from "@/lib/api/http";
import { publicAddress } from "@/lib/locations/address";
import { db } from "@/lib/db";

const querySchema = z.object({}).strict();

export async function GET(request: Request) {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const locations = await db.location.findMany({
    where: { active: true },
    orderBy: [{ city: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      address: true,
      city: true,
      postalCode: true,
      lat: true,
      lng: true,
      isPickupZoneCenter: true,
    },
  });
  return Response.json(
    locations.map((location) => ({
      ...location,
      address: publicAddress(location.address),
    })),
  );
}
