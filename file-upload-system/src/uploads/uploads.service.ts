// src/uploads/uploads.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { UploadsGateway } from './uploads.gateway';
import { promisify } from 'util';
import * as rimraf from 'rimraf';

const unlinkAsync = promisify(fs.unlink);
const rimrafAsync = promisify(rimraf.rimraf);

@Injectable()
export class UploadsService {
  private uploadDirectory = path.join(__dirname, '..', '..', 'uploads');
  private tempDirectory = path.join(__dirname, '..', '..', 'temp');

  constructor(private readonly uploadsGateway: UploadsGateway) {
    // Ensure the upload and temp directories exist
    [this.uploadDirectory, this.tempDirectory].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async handleFileUpload(file: Express.Multer.File, req: Request, res: Response) {
    const filename = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}-${file.originalname}`;
    const filepath = path.join(this.uploadDirectory, filename);
    const tempFilePath = path.join(this.tempDirectory, file.filename);

    const readStream = fs.createReadStream(tempFilePath);
    const writeStream = fs.createWriteStream(filepath);

    let uploadedBytes = 0;
    const totalBytes = file.size;

    // Assume client sends their socket ID in headers
    const clientId = req.headers['socket-id'] as string;

    return new Promise<void>((resolve, reject) => {
      readStream.on('error', async (err) => {
        console.error('Read Stream Error:', err);
        await this.cleanupTempFile(tempFilePath);
        this.uploadsGateway.sendError(clientId, 'Error reading the uploaded file.');
        res.status(500).json({
          message: 'Error reading the uploaded file.',
        });
        reject(err);
      });

      writeStream.on('error', async (err) => {
        console.error('Write Stream Error:', err);
        await this.cleanupFile(filepath);
        await this.cleanupTempFile(tempFilePath);
        this.uploadsGateway.sendError(clientId, 'Error saving the file.');
        res.status(500).json({
          message: 'Error saving the file.',
        });
        reject(err);
      });

      writeStream.on('finish', async () => {
        // Cleanup the temporary file after successful upload
        await this.cleanupTempFile(tempFilePath);
        res.status(201).json({
          message: 'File uploaded successfully',
          filename,
        });
        resolve();
      });

      // Track progress
      readStream.on('data', (chunk) => {
        uploadedBytes += chunk.length;
        const progress = Math.round((uploadedBytes / totalBytes) * 100);
        // Emit progress to the client via WebSocket
        if (clientId) {
          this.uploadsGateway.sendProgress(clientId, progress);
        }
      });

      // Pipe the read stream to the write stream
      readStream.pipe(writeStream);
    });
  }

  private async cleanupTempFile(tempFilePath: string) {
    try {
      if (fs.existsSync(tempFilePath)) {
        await unlinkAsync(tempFilePath);
        console.log(`Temporary file ${tempFilePath} deleted.`);
      }
    } catch (err) {
      console.error(`Error deleting temporary file ${tempFilePath}:`, err);
    }
  }

  private async cleanupFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
        console.log(`File ${filePath} deleted due to an error.`);
      }
    } catch (err) {
      console.error(`Error deleting file ${filePath}:`, err);
    }
  }
}
