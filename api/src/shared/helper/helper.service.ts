import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';

@Injectable()
export class HelperServices {
  generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }
}
