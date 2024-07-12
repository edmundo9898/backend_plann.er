import fastify from "fastify";
import cors from '@fastify/cors'
import { createTrip } from "./routes/create-trip";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { confirmTrip } from "./routes/confirm-trip";
import { confirmParticipant } from "./routes/confirmParticipant";
import { createActivity } from "./routes/createActivity";
import { getActivities } from "./routes/getAcitivities";
import { createLinks } from "./routes/createLinks";
import { getLinks } from "./routes/getLinks";
import { getParticipants } from "./routes/getParticipants";
import { createInvite } from "./routes/createInvite";
import { updateTrip } from "./routes/updateTrip";
import { getTripDetails } from "./routes/getTripDetails";
import { getParticipant } from "./routes/getParticipant";
import { errorHandler } from "./errorHandler";
import { env } from "./env";


const app = fastify();

app.register(cors, {
    origin: '*',
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.setErrorHandler(errorHandler)

console.log('Resgistrando rotas')
app.register(createTrip);
app.register(confirmTrip)
app.register(confirmParticipant)
app.register(createActivity)
app.register(getActivities)
app.register(createLinks)
app.register(getLinks)
app.register(getParticipants)
app.register(createInvite)
app.register(updateTrip)
app.register(getTripDetails)
app.register(getParticipant)
app.listen({port: env.PORT}).then(() => {
    console.log('Servidor iniciado na porta 3333');
})