import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginUsuario } from './dto/login.user'
import { registroUsuario } from './dto/register.user';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('registro')
  create(@Body() registro: registroUsuario) {
    return this.authService.create(registro);
  }

  @Public()
  @Post('login')
  login(@Body() login: loginUsuario) {
    return this.authService.login(login);
  }

  @Roles(Role.ESTUDIANTE)
  @Post('prueba')
  pruba(@Body() body:any){
    return 'en ejecución. '
  }
}
