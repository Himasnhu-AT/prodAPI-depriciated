import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Request, Response } from 'express';
import { Type } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as multer from 'multer';

class BodyDto {
  @IsNotEmpty()
  @IsString()
  userName: string;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  status: number;
}

class ParamsDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}

class RedirectQueryDto {
  @IsOptional()
  @IsUrl({}, { message: 'Invalid URL' })
  url?: string;
}

class RateLimitBodyDto {
  @IsOptional()
  limit?: number;

  @IsOptional()
  ttl?: number;

  url?: string;
}

class LargePayloadItemDto {
  @IsString()
  key?: string;

  @IsString()
  value?: string;
}

class LargePayloadDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LargePayloadItemDto)
  items: LargePayloadItemDto[];

  @IsNumber()
  @IsOptional()
  maxPayloadSize?: number;
}

// class FileUploadDto {
//   @IsNumber()
//   @IsOptional()
//   maxFileSize?: number; // In bytes

//   @IsArray()
//   @IsOptional()
//   @ArrayNotEmpty()
//   @IsString({ each: true })
//   allowedFileTypes?: string[];
  
//   //more checks can be added as per requirements
// }

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  private rateLimitStore = new Map<string, { count: number; expiry: number }>();

  private checkRateLimit(key: string, limit: number, ttl: number): boolean {
    const currentTime = Date.now();
    const rateLimitData = this.rateLimitStore.get(key) || { count: 0, expiry: currentTime + ttl };

    if (rateLimitData.expiry < currentTime) {
      rateLimitData.count = 0;
      rateLimitData.expiry = currentTime + ttl;
    }

    rateLimitData.count += 1;
    this.rateLimitStore.set(key, rateLimitData);

    return rateLimitData.count <= limit;
  }

  private validateLargePayload(items: LargePayloadItemDto[], maxPayloadSize?: number): boolean {
    const DEFAULT_MAX_PAYLOAD_SIZE = 10000; // Default size in bytes
    const payloadSize = JSON.stringify(items).length;

    const allowedSize = maxPayloadSize || DEFAULT_MAX_PAYLOAD_SIZE;

    return payloadSize <= allowedSize;
  }

  @Get()
  getHello(): string {
    console.log('GET /');
    return 'Hello World!';
  }

  @Get('require-header')
  requireHeader(@Headers('application-type') application: string): {
    message: string;
  } {
    console.log('GET /require-header', { application });

    switch (application) {
      case 'android/json':
        return { message: 'Android' };
      case 'ios/json':
        return { message: 'iOS' };
      case 'web/json':
        return { message: 'web' };
      default:
        throw new HttpException('Invalid header', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('require-body')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  requireBody(@Body() body: BodyDto): { message: string; data: object } {
    console.log('POST /require-body', { body });

    const { status } = body;

    switch (status) {
      case 201:
        return { message: 'userCreated', data: body };
      case 200:
        return { message: 'userPresent', data: body };
      case 301:
        return { message: 'userDeleted', data: body };
      case 404:
        return { message: 'userNotFound', data: body };
      case 500:
        return { message: 'serverError', data: body };
      default:
        throw new HttpException('Invalid status', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('require-param/:id')
  requireParam(@Param('id') id: string): { message: string; id: string } {
    console.log('GET /require-param', { id });
    return { message: 'Param received', id };
  }

  @Get('require-query')
  requireQuery(@Query('search') search: string): {
    message: string;
    search: string;
  } {
    console.log('GET /require-query', { search });
    return { message: 'Query received', search };
  }

  @Get('require-cookie')
  requireCookie(@Req() req: Request, @Res() res: Response): void {
    console.log('GET /require-cookie', { cookies: req.cookies });
    if (req.cookies.auth) {
      res
        .status(HttpStatus.OK)
        .json({ message: 'Cookie received', auth: req.cookies.auth });
    } else {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'No auth cookie found' });
    }
  }

  @Get('params/:id/:type')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  multipleParams(@Param() params: ParamsDto): { message: string; params: object } {
    console.log('GET /params', { params });

    // Add validation types as per requirements
    const validTypes = ['typeA', 'typeB', 'typeC'];
    if (!validTypes.includes(params.type)) {
      throw new HttpException('Invalid type parameter', HttpStatus.BAD_REQUEST);
    }

    return {
      message: 'Parameters received successfully',
      params: {
        id: params.id,
        type: params.type,
        idType: typeof params.id,
        typeType: typeof params.type,
      },
    };
  }

  @Get('redirect')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  redirect(@Query() query: RedirectQueryDto, @Res() res: Response): void {
    const defaultUrl = 'https://example.com';
    const redirectUrl = query.url || defaultUrl;

    console.log('GET /redirect', { redirectUrl });

    try {
      new URL(redirectUrl); // Validate the URL format
      res.redirect(redirectUrl);
    } catch (err) {
      throw new HttpException('Invalid URL provided', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('rate-limit-check')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  rateLimitCheck(
    @Body() body: RateLimitBodyDto,
    @Res() res: Response,
  ): void {
    const { limit, ttl, url } = body;
    const key = `rate-limit:${url}`; // Replace this with a unique key for each user/request as needed

    console.log('GET /rate-limit-check', { key, limit, ttl });

    const withinLimit = this.checkRateLimit(key, limit, ttl);
    console.log('Within limit:', withinLimit);

    if (withinLimit) {
      res.status(HttpStatus.OK).json({ withinLimit });
    } else {
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({ withinLimit });
    }
  }

  @Post('large-payload-check')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async largePayloadCheck(
    @Body() body: LargePayloadDto,
    @Res() res: Response,
  ): Promise<void> {
    const { items, maxPayloadSize } = body;

    console.log('Received payload:', items);

    const isPayloadValid = this.validateLargePayload(items, maxPayloadSize);

    if (isPayloadValid) {
      res.status(HttpStatus.OK).json({ isValid: true });
    } else {
      res.status(HttpStatus.BAD_REQUEST).json({ isValid: false });
    }
  }

  // need to finalise its logic and parameters, how parameters will be passed 
  // @Post('upload')
  // @UseInterceptors(FileInterceptor('file', {
  //   storage: diskStorage({
  //     destination: './uploads', // Specify the destination directory
  //     filename: (req, file, callback) => {
  //       const filename = `${Date.now()}-${file.originalname}`;
  //       callback(null, filename);
  //     },
  //   }),
  // }))
  // @UsePipes(new ValidationPipe({ whitelist: true }))
  // async uploadFile(
  //   @UploadedFile() file: multer.File,
  //   @Body() body: FileUploadDto,
  //   @Res() res: Response,
  // ): Promise<any> {
  //   if (!file) {
  //     return res.status(HttpStatus.BAD_REQUEST).json({ isValid: false, message: 'No file uploaded' });
  //   }

  //   const { maxFileSize, allowedFileTypes } = body;

  //   // Validate file size
  //   if (maxFileSize && file.size > maxFileSize) {
  //     return res.status(HttpStatus.BAD_REQUEST).json({ isValid: false, message: 'File size exceeds limit' });
  //   }

  //   // Validate file type
  //   if (allowedFileTypes && !allowedFileTypes.includes(file.mimetype)) {
  //     return res.status(HttpStatus.BAD_REQUEST).json({ isValid: false, message: 'Invalid file type' });
  //   }

  //   res.status(HttpStatus.OK).json({ isValid: true, filePath: file.path });
  }



  @Post('require-everything/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  requireEverything(
    @Param('id') id: string,
    @Headers('application-type') application: string,
    @Query('search') search: string,
    @Body() body: BodyDto,
    @Req() req: Request,
    @Res() res: Response,
  ): void {
    console.log('POST /require-everything', {
      id,
      application,
      search,
      body,
      cookies: req.cookies,
    });

    if (!req.cookies.auth) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'No auth cookie found' });
      return;
    }

    if (!application) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'No application header found' });
      return;
    }

    if (!search) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'No search query found' });
      return;
    }

    res.status(HttpStatus.OK).json({
      message: 'Everything received',
      data: { id, application, search, body, auth: req.cookies.auth },
    });
  }
}
