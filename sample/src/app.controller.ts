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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Request, Response } from 'express';

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

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    console.log('GET /');
    return 'Hello World!';
  }

  @Get('require-header')
  requireHeader(@Headers('application/type') application: string): {
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

  @Post('require-everything/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  requireEverything(
    @Param('id') id: string,
    @Headers('application/type') application: string,
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
