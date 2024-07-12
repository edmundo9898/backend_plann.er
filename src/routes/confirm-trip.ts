import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { promise, z } from "zod";
import { prisma } from "../lb/prisma";
import { dayjs } from "../lb/dayjs";
import { getMailClient } from "../lb/mail";
import nodemailer from 'nodemailer';
import { ClienteError } from "../erros/clientError";
import { env } from "../env";

export async function confirmTrip(app: FastifyInstance) {
  // get, post, put, patch, delete
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/confirm",
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participants: {
            where: {
              is_owner: false,
            },
          },
        },
      });

      if (!trip) {
        throw new ClienteError("Trip not found.");
      }

      if (trip.is_confirmed) {
        return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`);
      }

      await prisma.trip.update({
        where: { id: tripId },
        data: { is_confirmed: true },
      });
      

  
      const formattedStartDate = dayjs(trip.starts_at).format("LL");
      const formattedEndDate = dayjs(trip.ends_at).format("LL");

      
      const mail = await getMailClient();

      await Promise.all([
        trip.participants.map( async ( participant) => {
          const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`;

          const message = await mail.sendMail({
            from: {
              name: "Equipe planner",
              address: "oi@planer.com",
            },
            to: participant.email,
            subject: `Confirme sua presença para ${trip.destination} en ${formattedStartDate}`,
            html: `
               <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
              <p>Você foi convidada para participar de uma viagem para  <strong>${trip.destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong> <strong></strong>.</p>
              <p></p>
              <p>Para confirmar sua presença na viagem, clique no link abaixo:</p>
              <p></p>
              <p>
                <a href="${confirmationLink}">Confirmar viagem</a>
              </p>
              <p></p>
              <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p>
            </div>
            
            `.trim(),
          });
          console.log(nodemailer.getTestMessageUrl(message));


        })
      ])

      return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`);
      
    }
  );
}
