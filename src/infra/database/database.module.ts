

import { Module } from "@nestjs/common";


import { IAccountRepository } from "@/domain/auth/application/repositories/i-account-repository";


import { PrismaService } from "@/prisma/prisma.service";
import { PrismaAccountRepository } from "./prisma/repositories/prisma-account-repositories";

@Module({
    providers: [
        PrismaService,
        
        
        {
            provide: IAccountRepository,
            useClass: PrismaAccountRepository,
        },
        

       
        PrismaAccountRepository,
      
    
    ],
    exports: [
        PrismaService,
   
        IAccountRepository,
 
        PrismaService
    ],
})
export class DatabaseModule {}