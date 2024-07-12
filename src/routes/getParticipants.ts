import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lb/prisma";
import { dayjs } from "../lb/dayjs";
import { ClienteError } from "../erros/clientError";

export async function getParticipants(app: FastifyInstance) {
  console.log("Entrou na função createTrip");
  // get, post, put, patch, delete
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/participants",
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
        where: {
          id: tripId,
        },
        include: { participants: {
            select: {
                id: true,
                name: true,
                email: true,
                is_confirmed: true,
            }
        } },
      });

      if (!trip) {
        throw new ClienteError("Trip not found");
      }

      

      return { participants: trip.participants };
    }
  );
}
