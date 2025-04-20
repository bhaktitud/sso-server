import { SetMetadata } from '@nestjs/common';

export const REQUIRE_API_KEY = 'requireApiKey';

/**
 * Dekorator untuk menentukan apakah endpoint memerlukan API key
 * @param required - Boolean yang menentukan apakah API key diperlukan (default: true)
 */
export const RequireApiKey = (required: boolean = true) =>
  SetMetadata(REQUIRE_API_KEY, required);
