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
        }

        if (info) {
            this.logger.warn(`Info en handleRequest: ${JSON.stringify(info)}`);
        }

        if (!user) {
            this.logger.warn('No se recibió usuario en handleRequest');
        } else {
            this.logger.log(`Usuario recibido: ${user.email}`);
        }

        // Si hay un error, lo lanzamos para que sea manejado por el controlador
        if (err) {
            throw err;
        }

        // Si no hay usuario y no hay error, creamos un error
        if (!user) {
            const error = new Error('No se pudo autenticar con Google');
            this.logger.error('No user returned from Google OAuth');
            throw error;
        }

        return user;
    }
}
