// src/common/filters/all-exceptions.filter.ts

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { Response } from 'express';
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
  
      let status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
  
      let message =
        exception instanceof HttpException
          ? exception.getResponse()
          : 'Internal server error';
  
      // If the message is an object (e.g., validation errors), extract the message
      if (typeof message === 'object' && message !== null && 'message' in message) {
        message = (message as any).message;
      }
  
      console.error('Unhandled Exception:', exception);
  
      response.status(status).json({
        statusCode: status,
        message,
      });
    }
  }
  