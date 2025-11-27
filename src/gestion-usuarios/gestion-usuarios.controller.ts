import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { GestionUsuariosService } from './gestion-usuarios.service';
import { ChangeRoleDto, ChangeStatusDto, UpdatePersonalInfoDto, FilterUsersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Public } from 'src/auth';

@Controller('gestion-usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GestionUsuariosController {
  constructor(private readonly gestionUsuariosService: GestionUsuariosService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() filterUsersDto: FilterUsersDto) {
    return this.gestionUsuariosService.findAllWithFilters(filterUsersDto);
  }

  @Patch(':id/rol')
  @Roles(Role.ADMIN)
  changeRole(@Param('id') id: string, @Body() changeRoleDto: ChangeRoleDto) {
    return this.gestionUsuariosService.changeRole(id, changeRoleDto);
  }

  @Patch(':id/estado')
  @Roles(Role.ADMIN)
  changeStatus(@Param('id') id: string, @Body() changeStatusDto: ChangeStatusDto) {
    return this.gestionUsuariosService.changeStatus(id, changeStatusDto);
  }

  @Patch('me/info-personal')
  updateMyPersonalInfo(
    @GetUser('id') userId: string,
    @Body() updatePersonalInfoDto: UpdatePersonalInfoDto,
  ) {
    return this.gestionUsuariosService.updatePersonalInfo(userId, updatePersonalInfoDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  deleteUserByAdmin(@Param('id') id: string) {
    return this.gestionUsuariosService.deleteUser(id);
  }

  @Delete('me/cuenta')
  deleteMyAccount(@GetUser('id') userId: string) {
    return this.gestionUsuariosService.deleteUser(userId);
  }
}
