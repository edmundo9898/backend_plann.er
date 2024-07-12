import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lb/prisma";
import { ClienteError } from "../erros/clientError";

export async function getParticipant(app: FastifyInstance) {
  console.log("Entrou na função createTrip");
  // get, post, put, patch, delete
  app.withTypeProvider<ZodTypeProvider>().get(
    "/participants/:participantId",
    {
      schema: {
        params: z.object({  
          participantId: z.string().uuid(),
        }),
      },
    },
    async (request) => {
      const { participantId } = request.params;

      const participant = await prisma.participant.findUnique({
        select:{
            id: true,
            name: true,
            email:true,
            is_confirmed: true,
        },
        where: {
          id: participantId,
        }
      });

      if (!participant) {
        throw new ClienteError("Participant notFound");
      }

      

      return { participant};
    }
  );
}
