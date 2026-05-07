import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`API running at http://localhost:${port}`);
  logger.log(`GraphQL playground at http://localhost:${port}/graphql`);
}
bootstrap();

