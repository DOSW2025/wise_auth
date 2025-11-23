import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('users')
@Roles(Role.ADMIN) // Only admins can access user management
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    findAll(@Query() query: any) {
        return this.usersService.findAll({
            page: query.page,
            limit: query.limit,
            search: query.search,
            role: query.role,
            status: query.status,
        });
    }

    @Patch(':id/role')
    updateRole(@Param('id') id: string, @Body('role') role: string) {
        return this.usersService.updateRole(id, role);
    }

    @Patch(':id/suspend')
    suspend(@Param('id') id: string, @Body('reason') reason: string) {
        return this.usersService.suspend(id, reason);
    }

    @Patch(':id/activate')
    activate(@Param('id') id: string) {
        return this.usersService.activate(id);
    }
}
