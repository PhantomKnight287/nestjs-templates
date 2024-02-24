import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleTursoModule } from '@knaadh/nestjs-drizzle-turso';
import * as schema from './db/schema';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './resources/auth/auth.module';
import { AuthMiddleware } from './middlewares/auth/auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleTursoModule.register({
      tag: 'DB',
      turso: {
        config: {
          url: process.env.DATABASE_URL,
          authToken: process.env.DATABASE_AUTH_TOKEN,
        },
      },
      config: { schema: { ...schema } },
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).exclude(`/auth/(.*)`).forRoutes('*');
  }
}
