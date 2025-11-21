import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
    private readonly logger = new Logger(GoogleAuthGuard.name);

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();

        // Log detallado para debugging
        this.logger.log(`Google OAuth handleRequest called`);

        if (err) {
            this.logger.error(`Error en handleRequest: ${err.message}`, err.stack);
            throw err;
        }

        if (info) {
            this.logger.log(`Info en handleRequest: ${JSON.stringify(info)}`);
        }

        // Passport puede llamar handleRequest múltiples veces durante el flujo OAuth
        // Si ya tenemos un usuario en la request de una llamada anterior, usarlo
        if (!user && request.user) {
            this.logger.log(`Usuario ya existente en request: ${request.user.email}`);
            return request.user;
        }

        if (!user) {
            this.logger.warn('No se recibió usuario en handleRequest y no existe en request');
            const error = new Error('No se pudo autenticar con Google');
            throw error;
        }

        this.logger.log(`Usuario recibido y validado: ${user.email}`);
        return user;
    }
}
