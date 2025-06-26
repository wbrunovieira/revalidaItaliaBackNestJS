import { Env } from '@/env/env';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as fs from 'fs'; // Adicionando fs para ler arquivos
import { z } from 'zod';

const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  role: z.string(),
});
export type UserPayload = z.infer<typeof tokenPayloadSchema>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<Env, true>) {
    // Obtendo o caminho do arquivo da chave pública a partir das variáveis de ambiente
    const publicKeyPath = configService.get('JWT_PUBLIC_KEY_PATH', {
      infer: true,
    });

    let publicKey: string;

    if (publicKeyPath) {
      // Caso o caminho seja fornecido, lemos a chave diretamente do arquivo
      try {
        publicKey = fs.readFileSync(publicKeyPath, 'utf8');
      } catch (err) {
        throw new Error(
          `Unable to read the public key from the file at ${publicKeyPath}`,
        );
      }
    } else {
      // Caso não seja fornecido o caminho, tentamos buscar diretamente a chave em Base64
      const publicKeyBase64 = configService.get('JWT_PUBLIC_KEY', {
        infer: true,
      });
      if (!publicKeyBase64) {
        throw new Error('JWT_PUBLIC_KEY not defined');
      }
      // Decodifica a chave de Base64 para UTF-8
      publicKey = Buffer.from(publicKeyBase64, 'base64').toString('utf8');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: publicKey,
      algorithms: ['RS256'],
      passReqToCallback: false, // Garante que usaremos a sobrecarga sem o `request`
    });
  }

  async validate(payload: unknown): Promise<UserPayload> {
    const parsed = tokenPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return parsed.data;
  }
}
