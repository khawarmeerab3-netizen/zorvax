import type { FastifyInstance } from 'fastify';
import { AppError } from '../services/errors';

/** Global error handler — every failure becomes an ApiError envelope. */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      void reply.code(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }

    if ((error as { validation?: unknown }).validation) {
      void reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request body.' },
      });
      return;
    }

    app.log.error(error);
    void reply.code(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
    });
  });
}
