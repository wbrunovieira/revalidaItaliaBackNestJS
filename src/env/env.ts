import { z } from 'zod';

const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;

export const envSchema = z
  .object({
    // Base Configuration
    NODE_ENV: z.enum(['development', 'production']),
    DATABASE_URL: z.string().nonempty('DATABASE_URL não pode ser vazio'),
    NEXT_PUBLIC_URL: z.string().url(),
    PORT: z.coerce.number().default(3333),

    // JWT Configuration
    JWT_PRIVATE_KEY: z.string().nonempty().optional(),
    JWT_PUBLIC_KEY: z.string().nonempty().optional(),
    JWT_PRIVATE_KEY_PATH: z.string().optional(),
    JWT_PUBLIC_KEY_PATH: z.string().optional(),

    // Panda Video Configuration
    PANDA_API_BASE_URL: z
      .string()
      .url('PANDA_API_BASE_URL precisa ser uma URL válida')
      .default('https://api-v2.pandavideo.com.br'),
    PANDA_API_KEY: z.string().min(1, 'PANDA_API_KEY is required'),

    // Storage Configuration
    STORAGE_TYPE: z.enum(['local', 's3']).default('local'),

    // Local Storage Configuration
    LOCAL_STORAGE_PATH: z.string().default('./storage/documents'),
    LOCAL_BASE_URL: z
      .string()
      .url()
      .optional()
      .default('http://localhost:3000'),

    // S3 Configuration (optional - can use IAM roles)
    AWS_REGION: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET_NAME: z.string().optional(),
    S3_BASE_URL: z.string().url().optional(),

    // File Upload Configuration
    MAX_FILE_SIZE: z.coerce.number().default(50 * 1024 * 1024), // 50MB
    ALLOWED_FILE_TYPES: z
      .string()
      .default('pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv'),
  })
  .superRefine((data, ctx) => {
    // Validate S3 configuration when STORAGE_TYPE is 's3'
    if (data.STORAGE_TYPE === 's3') {
      // ✅ Só exigir AWS_REGION e S3_BUCKET_NAME
      // AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY são opcionais (IAM roles)
      const requiredS3Fields = ['AWS_REGION', 'S3_BUCKET_NAME'] as const;

      for (const field of requiredS3Fields) {
        if (!data[field]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field} is required when STORAGE_TYPE is 's3'`,
            path: [field],
          });
        }
      }
    }

    // Validate file size limits
    if (data.MAX_FILE_SIZE > 100 * 1024 * 1024) {
      // 100MB
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MAX_FILE_SIZE cannot exceed 100MB',
        path: ['MAX_FILE_SIZE'],
      });
    }

    if (!data.JWT_PRIVATE_KEY && !data.JWT_PRIVATE_KEY_PATH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_PRIVATE_KEY'],
        message: 'Você deve definir JWT_PRIVATE_KEY ou JWT_PRIVATE_KEY_PATH',
      });
    }
    if (!data.JWT_PUBLIC_KEY && !data.JWT_PUBLIC_KEY_PATH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_PUBLIC_KEY'],
        message: 'Você deve definir JWT_PUBLIC_KEY ou JWT_PUBLIC_KEY_PATH',
      });
    }

    // Validate allowed file types format
    const allowedTypes = data.ALLOWED_FILE_TYPES.split(',');
    const validExtensions = [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
      'csv',
      'zip',
      'rar',
    ];

    for (const type of allowedTypes) {
      const cleanType = type.trim().toLowerCase();
      if (!validExtensions.includes(cleanType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid file type: ${cleanType}. Allowed types: ${validExtensions.join(', ')}`,
          path: ['ALLOWED_FILE_TYPES'],
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;
