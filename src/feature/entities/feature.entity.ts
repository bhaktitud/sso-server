import { Feature } from '../../../generated/mysql';

export class FeatureEntity implements Feature {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} 