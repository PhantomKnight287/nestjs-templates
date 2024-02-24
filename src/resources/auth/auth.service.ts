import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseType } from 'src/types';
import { LoginDTO } from './dto/login.dto';
import { user as UserModel } from 'src/db/schema';
import { eq } from 'drizzle-orm';
import { hash, verify } from 'argon2';
import { JwtPayload, sign } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { SignupDTO } from './dto/signup.dto';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DB') private db: DatabaseType,
    private service: ConfigService,
  ) {}

  async login(body: LoginDTO) {
    const { password, username } = body;
    const user = await this.db
      .select()
      .from(UserModel)
      .where(eq(UserModel.username, username))
      .limit(1);
    if (!user.length)
      throw new HttpException(
        'No user found with given username.',
        HttpStatus.NOT_FOUND,
      );

    const isPasswordCorrect = await verify(user[0].password, password);
    if (isPasswordCorrect === false)
      throw new HttpException('Incorrect password', HttpStatus.UNAUTHORIZED);
    const token = sign({ id: user[0].id }, this.service.get('JWT_SECRET'));
    return {
      token,
      user: {
        name: user[0].name,
        username: user[0].username,
        id: user[0].id,
      },
    };
  }

  async signup(body: SignupDTO) {
    const { username, password, name } = body;
    const existingUser = await this.db
      .select()
      .from(UserModel)
      .where(eq(UserModel.username, username))
      .limit(1);

    if (existingUser[0]) {
      throw new HttpException(
        'Username is already taken.',
        HttpStatus.CONFLICT,
      );
    }

    const hashedPassword = await hash(password);
    const newUser = await this.db
      .insert(UserModel)
      .values({
        id: `user_${createId()}`,
        name,
        password: hashedPassword,
        username,
      })
      .returning();
    const token = sign({ id: newUser[0].id }, this.service.get('JWT_SECRET'));
    return {
      token,
      user: {
        id: newUser[0].id,
        username,
        name,
      },
    };
  }

  async verify(token: string) {
    try {
      const payload = verify(token, process.env.JWT_SECRET) as JwtPayload;
      const user = await this.db
        .select()
        .from(UserModel)
        .where(eq(UserModel.id, payload.id))
        .limit(1);
      if (!user[0]) throw new Error('Unauthorized');
      return user[0];
    } catch (e) {
      throw Error('Unauthorized');
    }
  }
}
