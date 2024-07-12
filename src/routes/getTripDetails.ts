import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lb/prisma";
import { dayjs } from "../lb/dayjs";
import { ClienteError } from "../erros/clientError";

export async function getTripDetails(app: FastifyInstance) {
  console.log("Entrou na função createTrip");
  // get, post, put, patch, delete
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId",
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params;

      const trip = await prisma.trip.findUnique({
        select: {
            id: true,
            destination: true,
            starts_at: true,
            ends_at: true,
            is_confirmed: true,
        },
        where: {
          id: tripId,
        },
      });

    

      if (!trip) {
        throw new ClienteError("Trip not found");
      }

    

      return { trip };
    }
  );
}
