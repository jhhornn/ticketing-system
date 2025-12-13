import { Module, Global } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { LockingService } from './locking.service';
import { RedlockService } from './redlock.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [LockingService, RedlockService],
  exports: [LockingService, RedlockService],
})
export class LocksModule {}
