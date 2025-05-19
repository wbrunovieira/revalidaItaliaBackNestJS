//src/infra/auth/reset-password.service.ts

import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";
import { Env } from "@/env/env";



@Injectable()
export class JwtResetPasswordService {
    private privateKey: string;
    private publicKey: string;

    constructor(private configService: ConfigService<Env, true>) {
        this.privateKey = Buffer.from(
            this.configService.get<string>("JWT_PRIVATE_KEY", { infer: true }),
            "base64"
        ).toString("utf8");
        this.publicKey = Buffer.from(
            this.configService.get<string>("JWT_PUBLIC_KEY", { infer: true }),
            "base64"
        ).toString("utf8");
    }

    generateResetToken(userId: string): string {
        const payload = { sub: userId, type: "reset-password" };
        return jwt.sign(payload, this.privateKey, {
            expiresIn: "15m",
            algorithm: "RS256",
        });
    }

    validateResetToken(token: string): any {
        try {
            const payload = jwt.verify(token, this.publicKey, {
                algorithms: ["RS256"],
            }) as jwt.JwtPayload;

            if (payload.type !== "reset-password") {
                throw new UnauthorizedException("Invalid token type");
            }

            return payload;
        } catch (error) {

            throw new UnauthorizedException("Invalid or expired tokeo");

        }
    }
}