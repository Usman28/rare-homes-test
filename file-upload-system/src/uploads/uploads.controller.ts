// src/uploads/uploads.controller.ts

import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Res,
    Req,
    BadRequestException,
  } from '@nestjs/common';
  import { MulterError } from 'multer';
  import {
    FileInterceptor,
  } from '@nestjs/platform-express';
  import { UploadsService } from './uploads.service';
  import { Request, Response } from 'express';
  import * as multer from 'multer';
  
  @Controller('uploads')
  export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) {}
  
    @Post('file')
    @UseInterceptors(
      FileInterceptor('file', {
        storage: multer.diskStorage({
          destination: './temp',
          filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
          },
        }),
        limits: {
          fileSize: 100 * 1024 * 1024, // 100 MB limit
        },
        fileFilter: (req, file, cb) => {
          const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'video/mp4',
            // Add other allowed MIME types here
          ];
          if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(
                'Invalid file type. Only JPEG, PNG images and MP4 videos are allowed.',
              ),
              false,
            );
          }
        },
      }),
    )
    async uploadFile(
      @UploadedFile() file: Express.Multer.File,
      @Req() req: Request,
      @Res() res: Response,
    ) {
      try {
        await this.uploadsService.handleFileUpload(file, req, res);
      } catch (error) {
        // Handle errors thrown from the service
        if (error instanceof MulterError) {
          // Handle Multer-specific errors
          if (error.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({
              message: 'File size exceeds the allowed limit of 100MB.',
            });
          } else {
            res.status(400).json({
              message: error.message,
            });
          }
        } else if (error instanceof BadRequestException) {
          res.status(400).json({
            message: error.message,
          });
        } else {
          res.status(500).json({
            message: 'An unexpected error occurred during file upload.',
          });
        }
      }
    }
  }
  