import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ForgotPasswordAuthDto } from './dto/forgot-password.dto';
import { VerifyOtpAuthDto } from './dto/verify-otp-auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterAuthUserDto } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Post('register')
  register(@Body() registerAuthUserDto: RegisterAuthUserDto) {
    return this.authService.registerUser(registerAuthUserDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordAuthDto: ForgotPasswordAuthDto) {
    return this.authService.forgotPassword(forgotPasswordAuthDto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpAuthDto: VerifyOtpAuthDto) {
    return this.authService.verifyOtp(verifyOtpAuthDto);
  }

  @Post('change-password')
  changePassword(@Body() changePasswordAuthDto: ChangePasswordDto) {
    return this.authService.changePassword(changePasswordAuthDto);
  }
}
