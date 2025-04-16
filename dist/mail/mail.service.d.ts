import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    sendPasswordResetEmail(to: string, name: string, token: string): Promise<void>;
    sendVerificationEmail(to: string, name: string, token: string): Promise<void>;
}
