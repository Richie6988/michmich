import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsEnum, IsString, IsDateString, IsUUID } from 'class-validator';

import { VotesService } from './votes.service';
import { JwtAuthGuard, CurrentUser } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { VoteType, VoteResponse } from './entities/vote.entity';

class CastVoteDto {
  @IsEnum(['pin', 'venue', 'accommodation']) voteType: 'pin' | 'venue' | 'accommodation';
  @IsString() targetId: string;
  @IsEnum(['love', 'meh', 'no']) response: 'love' | 'meh' | 'no';
}

class AddDateOptionDto {
  @IsDateString() date: string;
}

class VoteDateDto {
  @IsUUID() optionId: string;
  @IsEnum(['yes', 'maybe', 'no']) response: 'yes' | 'maybe' | 'no';
}

class CloseDatePollDto {
  @IsUUID() selectedOptionId: string;
}

@ApiTags('votes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  // ========= Generic votes =========

  @Get(':voteType')
  list(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('voteType') voteType: VoteType,
  ) {
    return this.votesService.listVotes(tripId, voteType);
  }

  @Post()
  cast(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: CastVoteDto,
    @CurrentUser() user: User,
  ) {
    return this.votesService.castVote(
      tripId, user.id, dto.voteType as VoteType, dto.targetId, dto.response as VoteResponse,
    );
  }

  @Delete(':voteType/:targetId')
  @HttpCode(204)
  async clear(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('voteType') voteType: VoteType,
    @Param('targetId') targetId: string,
    @CurrentUser() user: User,
  ) {
    await this.votesService.clearVote(tripId, user.id, voteType, targetId);
  }
}

@ApiTags('date-poll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/date-poll')
export class DatePollController {
  constructor(private readonly votesService: VotesService) {}

  @Get()
  get(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.votesService.getPoll(tripId);
  }

  @Post('options')
  @HttpCode(201)
  addOption(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: AddDateOptionDto,
    @CurrentUser() user: User,
  ) {
    return this.votesService.addOption(tripId, user.id, dto.date);
  }

  @Post('vote')
  voteDate(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: VoteDateDto,
    @CurrentUser() user: User,
  ) {
    return this.votesService.voteDate(tripId, user.id, dto.optionId, dto.response);
  }

  @Post('close')
  close(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: CloseDatePollDto,
    @CurrentUser() user: User,
  ) {
    return this.votesService.closePoll(tripId, user.id, dto.selectedOptionId);
  }
}
