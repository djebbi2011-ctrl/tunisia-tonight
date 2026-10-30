import {
  Controller, Get, Post, Param, Body, UseGuards,
  UseInterceptors, UploadedFile, Patch, Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { ContractsService } from './contracts.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  findAll(@Query('hotelId') hotelId?: string) {
    return this.contractsService.findAll(hotelId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body() dto: {
    hotelId: string;
    label: string;
    seasonStart: string;
    seasonEnd: string;
  }) {
    return this.contractsService.create(dto);
  }

  @Patch(':id/activate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  activate(@Param('id') id: string) {
    return this.contractsService.activate(id);
  }

  @Post(':id/rates')
  @Roles('ADMIN', 'SUPER_ADMIN')
  addRate(@Param('id') contractId: string, @Body() dto: any) {
    return this.contractsService.addRate(contractId, dto);
  }

  @Post(':id/upload')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/contracts',
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.xlsx', '.xls'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Fichier PDF ou Excel requis'), false);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  uploadFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const fileUrl = `/uploads/contracts/${file.filename}`;
    return this.contractsService.uploadFile(id, fileUrl);
  }
}
