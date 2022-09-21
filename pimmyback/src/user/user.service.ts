import { InjectRepository } from "@nestjs/typeorm"
import { catchError, from, map, Observable, switchMap, throwError } from 'rxjs'; import { AuthService } from "src/auth/auth.service";
import { Repository } from "typeorm/repository/Repository"
import { UserEntity } from "./models/user.entity"
import { User } from "./models/user.interface";

export class UserService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository:
            Repository<UserEntity>,
        private authService: AuthService
    ) { }

    create(user: User): Observable<User> {
        return this.authService.hashPassword(user.password).pipe(
            switchMap((paswordHash: string) => {
                const newUser = new UserEntity();
                newUser.name = user.name;
                newUser.username = user.username;
                newUser.email = user.email;
                newUser.password = paswordHash;
                newUser.role = user.role;
                return from(this.userRepository.save(newUser)).pipe(
                    map((user: User) => {
                        // 3 points -> syntaxe de décomposition de littéraux objets (new EMAScript)
                        // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Operators/Spread_syntax

                        const { password, ...result } = user;
                        return result;
                    }),
                    catchError(err => throwError(() => new Error('create user')))
                )
            })
        )
    }
    findOne(id: number): Observable<User> {
        return from(this.userRepository.findOne({
            where: {
                id: id
            }
        })).pipe(
            map((user: User) => {
                const { password, ...result } = user;
                return result;
            }),
            catchError(err => throwError(() => new Error('no user corresponding to that id')))
        );
    }
    findAll(): Observable<User[]> {
        return from(this.userRepository.find()).pipe(
            map((users: User[]) => {
                users.forEach(function (v) { delete v.password });
                return users;
            })
        );
    }
    deleteOne(id: number): Observable<any> {
        return from(this.userRepository.delete(id));
    }
    updateOne(id: number, user: User): Observable<any> {
        delete user.email;
        delete user.password;
        return from(this.userRepository.update(id, user));
    }
    login(user: User) {
        return this.validateUser(user.email, user.password).pipe(
            switchMap((user: User) => {
                if (user) {
                    // const token = this.authService.generateJWT(user);
                    // const roleUser = user.role;
                    // console.log(roleUser)
                    // return;
                    return this.authService.generateJWT(user).pipe(
                        map((jwt: string) => jwt)
                    );
                } else {
                    return 'Mauvais identifiants';
                }
            }
            ));
    }
    validateUser(email: string, password: string): Observable<User> {
        return this.findByMail(email).pipe(
            switchMap((user: User) => (this.authService.comparePassords(password, user.password).pipe(
                map((match: boolean) => {
                    if (match) {
                        const { password, ...result } = user;
                        return result;
                    } else {
                        console.log("yolo l'erreur")
                        throw Error();
                    }
                })
            ))

            ));
    }

    findByMail(email: string): Observable<User> {
        return from(this.userRepository.findOne({
            where: {
                email: email
            }
        }));
    }
}