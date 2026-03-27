import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  try {
    const requests = await dataSource.query(`SELECT id, title, status FROM prj_task_requests ORDER BY created_at DESC LIMIT 5`);
    console.log('--- RECENT TASK REQUESTS ---');
    console.log(JSON.stringify(requests, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await app.close();
  }
}

bootstrap();
