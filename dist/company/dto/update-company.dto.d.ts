import { CreateCompanyDto } from './create-company.dto';
declare const UpdateCompanyDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateCompanyDto>>;
export declare class UpdateCompanyDto extends UpdateCompanyDto_base {
    name?: string;
    description?: string;
    clientId?: string;
    clientSecret?: string;
}
export {};
