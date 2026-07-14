import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { TransformToNumber } from 'src/custom-decorator/custom-transform-decorator';

export class QueryPaginationDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @TransformToNumber()
  limit: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @TransformToNumber()
  offset: number;
}
