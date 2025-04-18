import { Company } from '../../../generated/mysql';
export declare class CompanyResponseDto implements Omit<Company, 'admins'> {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}
