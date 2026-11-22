/**
 * Shared utilities for the Equipment module.
 * USER_SELECT and generateSlug are re-exported from common for backward compat.
 */
export { USER_SELECT, LIST_FIRST_IMAGE_AND_COUNT_INCLUDE, generateSlug } from '../common/utils/entity.utils';

export const MAX_IMAGES_PER_LISTING = 10;
export const MAX_IMAGES_PER_REQUEST = 5;
