import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { GestionUsuariosService } from './gestion-usuarios.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Public } from 'src/auth';

@Controller('gestion-usuarios')
//@UseGuards(JwtAuthGuard, RolesGuard)
//@Roles(Role.ADMIN)
export class GestionUsuariosController {
  constructor(private readonly gestionUsuariosService: GestionUsuariosService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.gestionUsuariosService.findAllPaginated(paginationDto);
  }
  @Public()
  @Patch(':id/rol')
  changeRole(@Param('id') id: string, @Body() changeRoleDto: ChangeRoleDto) {
    return this.gestionUsuariosService.changeRole(id, changeRoleDto);
  }

  @Patch(':id/estado')
  changeStatus(@Param('id') id: string, @Body() changeStatusDto: ChangeStatusDto) {
    return this.gestionUsuariosService.changeStatus(id, changeStatusDto);
  }
}
