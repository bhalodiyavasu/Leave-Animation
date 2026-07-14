import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateLeaveDto } from './create-leave.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateLeaveDto extends PartialType(CreateLeaveDto) {
  @ApiProperty()
  @IsString()
  @IsOptional()
  status?: string;
}
