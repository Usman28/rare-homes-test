// src/uploads/uploads.module.ts

import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { UploadsGateway } from './uploads.gateway';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, UploadsGateway],
})
export class UploadsModule {}
