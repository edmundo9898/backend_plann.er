import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import nodemailer from "nodemailer";

import { prisma } from "../lb/prisma";
import { getMailClient } from "../lb/mail";
import { dayjs } from "../lb/dayjs";
import { ClienteError } from "../erros/clientError";
import { env } from "../env";

export async function createTrip(app: FastifyInstance) {
  console.log('Entrou na função createTrip');
  // get, post, put, patch, delete
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trips",
    {
      schema: {
        body: z.object({
          destination: z.string({required_error: 'Destination is required'}).min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
          owner_name: z.string(),
          owner_email: z.string().email(),
          emails_to_invite: z.array(z.string().email()),
        }),
      },
    },
    async (request) => {
      const {
        destination,
        starts_at,
        ends_at,
        owner_name,
        owner_email,
        emails_to_invite,
      } = request.body;
       
      console.log('Dados recebidos:', {
        destination,
        starts_at,
        ends_at,
        owner_name,
        owner_email,
        emails_to_invite,
      });
      
 
      if (dayjs(starts_at).isBefore(new Date())) {
        console.log('Erro: Data de início inválida:', starts_at);
        throw new ClienteError("Invalid trip start date.")
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        console.log('Erro: Data de término inválida:', ends_at);
        throw new ClienteError("Invalid trip end date.")
      }

      

      const trip = await prisma.trip.create({
        data: {
          destination,
          starts_at,
          ends_at,
          participants: {
            createMany: {
              data: [
                {
                  name: owner_name,
                  email: owner_email,
                  is_owner: true,
                  is_confirmed: true,
                },

                ...emails_to_invite.map((email) => {
                  return { email };
                }),
              ],
            },
          },
        },
      });

      await prisma.participant.create({
        data: {
          name: owner_name,
          email: owner_email,
          trip_id: trip.id,
        },
      });

      const formattedStartDate = dayjs(starts_at).format('LL')
      const formattedEndDate = dayjs(ends_at).format('LL')

      const confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm`;

      const mail = await getMailClient();

      const message = await mail.sendMail({
        from: {
          name: "Equipe planner",
          address: "oi@planer.com",
        },
        to: {
          name: owner_name,
          address: owner_email,
        },
        subject: `Confirme sua viagem para ${destination} en ${formattedStartDate}`,
        html: `
           <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
          <p>Você solicitou a criação de uma viagem para <strong>${destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong> <strong></strong>.</p>
          <p></p>
          <p>Para confirmar sua viagem, clique no link abaixo:</p>
          <p></p>
          <p>
            <a href="${confirmationLink}">Confirmar viagem</a>
          </p>
          <p></p>
          <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p>
        </div>
        
        `.trim(),
      });
      console.log(nodemailer.getTestMessageUrl(message))
      return { tripId: trip.id };
    }
  );
}
