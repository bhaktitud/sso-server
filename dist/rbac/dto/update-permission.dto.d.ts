import { CreatePermissionDto } from './create-permission.dto';
declare const UpdatePermissionDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePermissionDto>>;
export declare class UpdatePermissionDto extends UpdatePermissionDto_base {
    action?: string;
    subject?: string;
}
export {};
