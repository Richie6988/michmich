import {
  IsString, IsOptional, IsEnum, IsArray, IsNumber, IsBoolean,
  IsDateString, MaxLength, MinLength, IsUUID, Min, Max,
} from 'class-validator';

export class CreateTripDto {
  @IsString() @MinLength(1) @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsEnum(['dinner', 'weekend', 'evg', 'evjf', 'family', 'corporate', 'custom']) tripType?: string;
  @IsOptional() @IsEnum(['wanderlust', 'trip']) mode?: 'wanderlust' | 'trip';
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsArray() friendNames?: string[];
}

export class UpdateTripDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsEnum(['draft', 'inviting', 'constraints', 'calculating', 'voting', 'booked', 'completed', 'cancelled']) status?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsBoolean() stealthMode?: boolean;
}

export class AddParticipantByNameDto {
  @IsString() @MinLength(1) @MaxLength(100) name: string;
}

export class UpdateParticipantConstraintsDto {
  @IsOptional() @IsEnum(['walk', 'bike', 'transit', 'car', 'train', 'flight']) transportMode?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1) timeWeight?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) moneyWeight?: number;
  @IsOptional() @IsNumber() @Min(0) maxTime?: number;
  @IsOptional() @IsString() maxTimeUnit?: string;
  @IsOptional() @IsNumber() @Min(0) maxMoney?: number;
  @IsOptional() @IsString() maxMoneyCurrency?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsBoolean() selfBook?: boolean;
  @IsOptional() @IsArray() reductionCards?: any[];
  @IsOptional() @IsNumber() originLat?: number;
  @IsOptional() @IsNumber() originLng?: number;
  @IsOptional() @IsString() originLabel?: string;
}

export class CreateTaskDto {
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID() assignedToId?: string;
}

export class CreatePhotoDto {
  @IsString() imageUrl: string;
  @IsOptional() @IsString() @MaxLength(500) caption?: string;
}
