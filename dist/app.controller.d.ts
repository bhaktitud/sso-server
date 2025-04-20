import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getHealth(): Promise<Record<string, string>>;
    getCountries(): {
        code: string;
        name: string;
    }[];
    getTimezones(): {
        id: string;
        offset: string;
        name: string;
    }[];
}
