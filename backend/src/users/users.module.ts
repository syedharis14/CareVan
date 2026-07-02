import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { ParentService } from './parent.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, MeController],
  providers: [UsersService, ParentService],
  exports: [UsersService],
})
export class UsersModule {}
