import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { Resend } from "resend";
import { PrismaService } from "src/prisma/prisma.service";
import {
  OTP_EXPIRY_TIME_IN_MINS,
  RESEND_FROM_EMAIL,
} from "src/shared/constants/constant";
import { EXPIRY_TIME_IN_MINS, JWT_SECRET } from "src/shared/constants/jwt";
import { HelperServices } from "src/shared/helper/helper.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordAuthDto } from "./dto/forgot-password.dto";
import { LoginAuthDto } from "./dto/login-auth.dto";
import { RegisterAuthUserDto } from "./dto/register-user.dto";
import { VerifyOtpAuthDto } from "./dto/verify-otp-auth.dto";

import { getEnvVar } from "src/leave/worker-env.registry";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private helperService: HelperServices,
  ) {}

  private jwtSecret = JWT_SECRET;

  private _resend: Resend | undefined;
  private get resend() {
    if (!this._resend) {
      this._resend = new Resend(getEnvVar("RESEND_API_KEY"));
    }
    return this._resend;
  }

  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;

    try {
      const user = await this.prisma.client.user.findUnique({
        where: {
          email,
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        throw new UnauthorizedException("Invalid credentials");
      }

      const payload = {
        id: user.id,
        email: user.email,
      };

      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: `${EXPIRY_TIME_IN_MINS.USER_TOKEN as number}m`,
      });

      const userWithoutPassword = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      };

      return {
        token,
        user: userWithoutPassword,
        message: "Login successfully!",
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException("Something went wrong");
    }
  }

  async registerUser(registerAuthUserDto: RegisterAuthUserDto) {
    const { email, password, name, phone, confirmPassword } =
      registerAuthUserDto;

    try {
      const user = await this.prisma.client.user.findUnique({
        where: {
          email,
        },
      });

      if (user) {
        throw new UnauthorizedException("User already exists with this email");
      }

      if (password !== confirmPassword) {
        throw new UnauthorizedException(
          "Password and confirm password do not match",
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const createdUser = await this.prisma.client.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: {
            connectOrCreate: {
              where: {
                name: "User",
              },
              create: {
                name: "User",
              },
            },
          },
        },
      });

      const payload = {
        id: createdUser.id,
        email: createdUser.email,
      };

      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: `${EXPIRY_TIME_IN_MINS.USER_TOKEN as number}m`,
      });

      const userWithoutPassword = {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
      };

      return {
        token,
        user: userWithoutPassword,
        message: "User registered successfully!",
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException("Something went wrong");
    }
  }

  async forgotPassword(forgotPasswordAuthDto: ForgotPasswordAuthDto) {
    const { email } = forgotPasswordAuthDto;

    try {
      const user = await this.prisma.client.user.findFirst({
        where: {
          email,
        },
      });

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const otp = this.helperService.generateOTP();
      const expiresAt = new Date(
        Date.now() + OTP_EXPIRY_TIME_IN_MINS * 60 * 1000,
      );

      const existPasswordReset =
        await this.prisma.client.passwordReset.findFirst({
          where: {
            email,
          },
        });

      if (existPasswordReset) {
        await this.prisma.client.passwordReset.update({
          where: {
            id: existPasswordReset.id,
          },
          data: {
            otp,
            expiresAt,
            isVerified: false,
          },
        });
      } else {
        await this.prisma.client.passwordReset.create({
          data: {
            email,
            otp,
            expiresAt,
          },
        });
      }

      await this.resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
      });

      return {
        message: "OTP sent successfully!",
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async verifyOtp(verifyOtpAuthDto: VerifyOtpAuthDto) {
    const { email, otp } = verifyOtpAuthDto;

    try {
      const existPasswordReset =
        await this.prisma.client.passwordReset.findFirst({
          where: {
            email,
            otp,
          },
        });

      if (!existPasswordReset) {
        throw new UnauthorizedException("Invalid OTP");
      }

      if (existPasswordReset.expiresAt < new Date()) {
        throw new UnauthorizedException("OTP has expired");
      }

      await this.prisma.client.passwordReset.update({
        where: { id: existPasswordReset.id },
        data: {
          isVerified: true,
          otp: "",
        },
      });

      return {
        message: "OTP verified successfully!",
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const { email, newPassword, confirmPassword } = changePasswordDto;

    try {
      const existPasswordReset =
        await this.prisma.client.passwordReset.findFirst({
          where: {
            email,
          },
        });

      if (!existPasswordReset) {
        throw new UnauthorizedException("User not found");
      }

      if (!existPasswordReset.isVerified) {
        throw new UnauthorizedException("OTP not verified");
      }

      if (newPassword !== confirmPassword) {
        throw new UnauthorizedException("Passwords do not match");
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.client.user.update({
        where: {
          email,
        },
        data: {
          password: hashedPassword,
        },
      });

      await this.prisma.client.passwordReset.update({
        where: {
          id: existPasswordReset.id,
        },
        data: {
          isVerified: false,
        },
      });

      return {
        message: "Password changed successfully!",
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async validateUser(payload) {
    const userId = payload?.id || payload?.sub || payload?.userId;
    if (!userId) {
      throw new UnauthorizedException("Token payload is missing user id");
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    return user;
  }
}
