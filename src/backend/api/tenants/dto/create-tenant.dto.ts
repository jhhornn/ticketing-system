import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corp', description: 'The name of the organization' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A leading provider of widgets', description: 'Description of the organization', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'user-uuid', description: 'The ID of the user who will own this tenant' })
  @IsString()
  @IsNotEmpty()
  ownerId: string;
}
