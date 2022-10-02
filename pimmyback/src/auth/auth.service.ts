import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { from, Observable, of } from 'rxjs';
import { User } from 'src/user/models/user.interface';
const bcrypt = require('bcrypt');

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) { }
    generateJWT(user: User): Observable<string> {
        return from(this.jwtService.signAsync({ user }));
    }
    //Penser à faire une fonction si on veut crypter plusieurs trucs à la fois pas jsute le mdp
    hashPassword(password: string): Observable<string> {
        return from<string>(bcrypt.hash(password, 10));
    }
    comparePassords(newPassword: string, passwordHash: string): Observable<any | boolean> {
        return of<any | boolean>(bcrypt.compareSync(newPassword, passwordHash));
    }
}