import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { Resend } from "resend";
import { MongoService } from "src/mongo/mongo.service";
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
    private mongo: MongoService,
    private helperService: HelperServices,
  ) {}

  private get jwtSecret() {
    return getEnvVar("JWT_SECRET") || JWT_SECRET;
  }

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
      const user = await this.mongo.db.collection("users").findOne({
        email,
      });

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        throw new UnauthorizedException("Invalid credentials");
      }

      if (user.roleId) {
        const role = await this.mongo.db.collection("roles").findOne({
          _id: user.roleId,
        });
        user.role = this.mongo.mapDoc(role);
      }

      const payload = {
        id: user._id.toString(),
        email: user.email,
      };

      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: `${EXPIRY_TIME_IN_MINS.USER_TOKEN as number}m`,
      });

      const userWithoutPassword = {
        id: user._id.toString(),
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
      const user = await this.mongo.db.collection("users").findOne({
        email,
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

      let userRole = await this.mongo.db
        .collection("roles")
        .findOne({ name: "User" });
      if (!userRole) {
        const res = await this.mongo.db.collection("roles").insertOne({
          name: "User",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        userRole = { _id: res.insertedId, name: "User" } as any;
      }

      const userDoc = {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        roleId: userRole!._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userRes = await this.mongo.db
        .collection("users")
        .insertOne(userDoc);
      const createdUser = await this.mongo.db
        .collection("users")
        .findOne({ _id: userRes.insertedId });
      if (createdUser && createdUser.roleId) {
        const role = await this.mongo.db
          .collection("roles")
          .findOne({ _id: createdUser.roleId });
        createdUser.role = this.mongo.mapDoc(role);
      }

      const mappedUser = this.mongo.mapDoc(createdUser);

      const payload = {
        id: mappedUser.id,
        email: mappedUser.email,
      };

      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: `${EXPIRY_TIME_IN_MINS.USER_TOKEN as number}m`,
      });

      const userWithoutPassword = {
        id: mappedUser.id,
        name: mappedUser.name,
        email: mappedUser.email,
        phone: mappedUser.phone,
        role: mappedUser.role,
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
      const user = await this.mongo.db.collection("users").findOne({
        email,
      });

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const otp = this.helperService.generateOTP();
      const expiresAt = new Date(
        Date.now() + OTP_EXPIRY_TIME_IN_MINS * 60 * 1000,
      );

      const existPasswordReset = await this.mongo.db
        .collection("passwordResets")
        .findOne({
          email,
        });

      if (existPasswordReset) {
        await this.mongo.db.collection("passwordResets").updateOne(
          { _id: existPasswordReset._id },
          {
            $set: {
              otp,
              expiresAt,
              isVerified: false,
              updatedAt: new Date(),
            },
          },
        );
      } else {
        await this.mongo.db.collection("passwordResets").insertOne({
          email,
          otp,
          expiresAt,
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
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
      const existPasswordReset = await this.mongo.db
        .collection("passwordResets")
        .findOne({
          email,
          otp,
        });

      if (!existPasswordReset) {
        throw new UnauthorizedException("Invalid OTP");
      }

      if (existPasswordReset.expiresAt < new Date()) {
        throw new UnauthorizedException("OTP has expired");
      }

      await this.mongo.db.collection("passwordResets").updateOne(
        { _id: existPasswordReset._id },
        {
          $set: {
            isVerified: true,
            otp: "",
            updatedAt: new Date(),
          },
        },
      );

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
      const existPasswordReset = await this.mongo.db
        .collection("passwordResets")
        .findOne({
          email,
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

      await this.mongo.db.collection("users").updateOne(
        { email },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        },
      );

      await this.mongo.db.collection("passwordResets").updateOne(
        { _id: existPasswordReset._id },
        {
          $set: {
            isVerified: false,
            updatedAt: new Date(),
          },
        },
      );

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

    const user = await this.mongo.db.collection("users").findOne({
      _id: this.mongo.toObjectId(userId),
    });

    return this.mongo.mapDoc(user);
  }
}
