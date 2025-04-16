import { UserService } from './user.service';
import { ViewProfileDto } from './dto/view-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getProfile(req: any): Promise<ViewProfileDto>;
    updateProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<ViewProfileDto>;
}
