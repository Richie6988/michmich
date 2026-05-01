import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,
  HttpCode, ParseUUIDPipe, Query, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { TripsService } from './trips.service';
import {
  CreateTripDto, UpdateTripDto, AddParticipantByNameDto,
  UpdateParticipantConstraintsDto, CreateTaskDto, CreatePhotoDto,
} from './dto/trip.dto';
import { JwtAuthGuard, CurrentUser } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  // ============================================================
  // Trips
  // ============================================================

  @Get()
  list(@CurrentUser() user: User) {
    return this.tripsService.listForUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.tripsService.findById(id, user.id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateTripDto, @CurrentUser() user: User) {
    return this.tripsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripDto,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.update(id, user.id, dto);
  }

  @Post(':id/duplicate')
  @HttpCode(201)
  duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('name') name: string,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.duplicate(id, user.id, name);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.tripsService.remove(id, user.id);
  }

  // ============================================================
  // Public: lookup trip by invite token (no auth needed)
  // ============================================================
  // Note: this is registered separately at JoinController in voting module to avoid auth.

  // ============================================================
  // Participants
  // ============================================================

  @Post(':id/participants')
  @HttpCode(201)
  addParticipant(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: AddParticipantByNameDto,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.addParticipantByName(tripId, user.id, dto.name);
  }

  @Delete(':id/participants/:participantId')
  @HttpCode(204)
  async removeParticipant(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @CurrentUser() user: User,
  ) {
    await this.tripsService.removeParticipant(tripId, user.id, participantId);
  }

  @Patch(':id/me/constraints')
  updateMyConstraints(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: UpdateParticipantConstraintsDto,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.updateMyConstraints(tripId, user.id, dto);
  }

  // ============================================================
  // Tasks
  // ============================================================

  @Get(':id/tasks')
  listTasks(@Param('id', ParseUUIDPipe) tripId: string, @CurrentUser() user: User) {
    return this.tripsService.listTasks(tripId, user.id);
  }

  @Post(':id/tasks')
  @HttpCode(201)
  createTask(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.createTask(tripId, user.id, dto);
  }

  @Patch(':id/tasks/:taskId/toggle')
  toggleTask(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.toggleTask(tripId, user.id, taskId);
  }

  @Patch(':id/tasks/:taskId/assign')
  reassignTask(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body('assignedToId') assignedToId: string | null,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.reassignTask(tripId, user.id, taskId, assignedToId);
  }

  @Delete(':id/tasks/:taskId')
  @HttpCode(204)
  async removeTask(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: User,
  ) {
    await this.tripsService.removeTask(tripId, user.id, taskId);
  }

  // ============================================================
  // Photos
  // ============================================================

  @Get(':id/photos')
  listPhotos(@Param('id', ParseUUIDPipe) tripId: string, @CurrentUser() user: User) {
    return this.tripsService.listPhotos(tripId, user.id);
  }

  @Post(':id/photos')
  @HttpCode(201)
  addPhoto(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: CreatePhotoDto,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.addPhoto(tripId, user, dto);
  }

  @Delete(':id/photos/:photoId')
  @HttpCode(204)
  async removePhoto(
    @Param('id', ParseUUIDPipe) tripId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @CurrentUser() user: User,
  ) {
    await this.tripsService.removePhoto(tripId, user.id, photoId);
  }
}
