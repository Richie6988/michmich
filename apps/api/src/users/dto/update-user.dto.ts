import {
  IsString, IsOptional, IsNumber, IsEnum, IsBoolean,
  IsEmail, MaxLength, IsArray, IsIn, Min, Max,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @IsOptional() @IsString() avatarUrl?: string | null;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsString() @MaxLength(5) locale?: string;
  @IsOptional() @IsEnum(['walk', 'bike', 'transit', 'car', 'train', 'flight']) defaultTransportMode?: string;
  @IsOptional() @IsString() homeLabel?: string;
  @IsOptional() @IsNumber() @Min(0) defaultMaxTime?: number;
  @IsOptional() @IsString() defaultMaxTimeUnit?: string;
  @IsOptional() @IsNumber() @Min(0) defaultMaxBudget?: number;
  @IsOptional() @IsString() @MaxLength(3) defaultMaxBudgetCurrency?: string;
  @IsOptional() @IsEmail() defaultEmail?: string;
  @IsOptional() @IsBoolean() defaultSelfBook?: boolean;
  @IsOptional() @IsArray() defaultReductionCards?: any[];
  @IsOptional() @IsIn(['light', 'dark', 'auto']) theme?: string;
}

export class SetHomeLocationDto {
  @IsNumber() @Min(-90) @Max(90) lat: number;
  @IsNumber() @Min(-180) @Max(180) lng: number;
  @IsOptional() @IsString() label?: string;
}
