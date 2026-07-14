import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { QueryPaginationDto } from 'src/shared/dto/query-pagination.dto';

export class QueryRoleDto extends PartialType(QueryPaginationDto) {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;
}
