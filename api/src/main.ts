import {
  ValidationPipe,
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error ? exception.message : "Internal server error";

    const stack = exception instanceof Error ? exception.stack : null;

    response.status(status).json({
      statusCode: status,
      message: message,
      stack: stack,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Accept,Authorization",
    credentials: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle("Leave Management API")
    .setDescription("Leave Management API documentation")
    .addBearerAuth()
    .addSecurityRequirements("bearer")
    .setVersion("1.0")
    .build();

  if (process.env.SWAGGER_DOCUMENTATION_AVAILABLE === "true") {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
    }),
  );

  await app.listen(process.env.PORT ?? 3030);
}

if (require.main === module) {
  void bootstrap();
}
