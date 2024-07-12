import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lb/prisma";
import { dayjs } from "../lb/dayjs";
import { ClienteError } from "../erros/clientError";

export async function getActivities(app: FastifyInstance) {
  console.log("Entrou na função createTrip");
  // get, post, put, patch, delete
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/activities",
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
        include: { Activities: {
            orderBy: {
                occurs_at: 'asc',
            }
        } },
      });

      if (!trip) {
        throw new ClienteError("Trip not found");
      }

      const diferenceInDayBetweenTripsStartAndEnd = dayjs(trip.ends_at).diff(
        trip.starts_at,
        "days"
      );

      const activities = Array.from({
        length: diferenceInDayBetweenTripsStartAndEnd + 1,
      }).map((_, index) => {
        const date = dayjs(trip.starts_at).add(index, "days");

        return {
          date: date.toDate(),
          activities: trip.Activities.filter((activity) => {
            return dayjs(activity.occurs_at).isSame(date, "day");
          }),
        };
      });

      return { activities };
    }
  );
}
