// src/infra/auth/strategies/jwt.strategy.ts

import { Env } from "@/env/env";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { z } from "zod";

const tokenPayloadSchema = z.object({
  sub:  z.string().uuid(),
  role: z.string(),
});
export type UserPayload = z.infer<typeof tokenPayloadSchema>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(configService: ConfigService<Env, true>) {

    const publicKeyBase64 = configService.get("JWT_PUBLIC_KEY", { infer: true });
    if (!publicKeyBase64) {
      throw new Error("JWT_PUBLIC_KEY not defined");
    }


    const publicKey = Buffer.from(publicKeyBase64, "base64").toString("utf8");


    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:    publicKey,
      algorithms:     ["RS256"],
      passReqToCallback: false,      // garante usar a sobrecarga sem request
    });

    // se não precisar usar configService em outros métodos, não precisa armazenar em this
  }

  async validate(payload: unknown): Promise<UserPayload> {
    const parsed = tokenPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new UnauthorizedException("Invalid token payload");
    }
    return parsed.data;
  }
}