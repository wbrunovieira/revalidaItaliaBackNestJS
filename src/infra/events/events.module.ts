// src/infra/events/events.module.ts
import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NestEventDispatcher } from './nest-event-dispatcher';
import { EVENT_DISPATCHER } from '@/core/domain/events/i-event-dispatcher';
import { DomainEventLoggerHandler } from './handlers/domain-event-logger.handler';
import { UserLoggedInHandler } from './handlers/user-logged-in.handler';
import { UserLoggedOutHandler } from './handlers/user-logged-out.handler';
import { IOnlineUserTracker } from '@/domain/auth/application/services/i-online-user-tracker';
import { RedisOnlineUserTracker } from '@/infra/database/redis/services/redis-online-user-tracker';
import { DatabaseModule } from '@/infra/database/database.module';

/**
 * Events Module
 * 
 * Global module that provides event dispatching infrastructure.
 * Uses NestJS EventEmitter2 for async event handling.
 */
@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Configuration options
      wildcard: true, // Enable wildcard events
      delimiter: '.', // Delimiter for namespaced events
      newListener: false, // Don't emit newListener events
      removeListener: false, // Don't emit removeListener events
      maxListeners: 10, // Maximum listeners per event
      verboseMemoryLeak: false, // Don't show memory leak warnings
      ignoreErrors: false, // Don't ignore errors in listeners
    }),
    DatabaseModule, // For Redis access
  ],
  providers: [
    {
      provide: EVENT_DISPATCHER,
      useClass: NestEventDispatcher,
    },
    {
      provide: IOnlineUserTracker,
      useClass: RedisOnlineUserTracker,
    },
    NestEventDispatcher,
    DomainEventLoggerHandler, // Global event logger
    UserLoggedInHandler, // Handle user login events
    UserLoggedOutHandler, // Handle user logout events
  ],
  exports: [EVENT_DISPATCHER, NestEventDispatcher, IOnlineUserTracker],
})
export class EventsModule {}