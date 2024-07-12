import type { FastifyInstance } from "fastify";
import { ClienteError } from "./erros/clientError";
import { ZodError } from "zod";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Invalid input",
      errors: error.flatten().fieldErrors
    });
  }
  console.log(error);

  if (error instanceof ClienteError) {
    return reply.status(400).send({
      message: error.message,
    });
  }

  return reply.status(500).send({ message: "Internal server error" });
};
