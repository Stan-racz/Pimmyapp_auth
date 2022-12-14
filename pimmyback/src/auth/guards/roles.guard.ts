import { Injectable, CanActivate, ExecutionContext, Inject, forwardRef, ConsoleLogger } from "@nestjs/common";

import { Reflector } from "@nestjs/core";
import { UserService } from "src/user/user.service";
import { map, Observable } from "rxjs";
import { User } from "src/user/models/user.interface";
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @Inject(forwardRef(() => UserService))
        private userService: UserService
    ) { }
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }

        const request = context.switchToHttp().getRequest<any>();
        return this.userService.findOne(request["user"].user.id).pipe(
            map((user: User) => {
                const hasRole = () => roles.indexOf(user.role) > -1;
                let hasPermission: boolean = false;
                if (hasRole()) {
                    hasPermission = true;
                };
                return user && hasPermission;
            })
        )
    }
}