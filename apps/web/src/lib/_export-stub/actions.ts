/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Static-export action stubs.
 *
 * `output: 'export'` builds reject any 'use server' file in the bundle.
 * When EXPORT=1, next.config's webpack NormalModuleReplacementPlugin swaps
 * every `lib/*\/actions.ts` to this file. Each named export here matches a
 * real action's name; calls are no-ops that return a STATIC_EXPORT failure.
 *
 * This file is NEVER imported in the live (Vercel / local) build.
 */

const STUB = { ok: false as const, error: 'STATIC_EXPORT' as const };

const noop: any = async (..._args: unknown[]) => STUB;

// Auth
export const signInAction: any = noop;
export const signUpAction: any = noop;
export const signOutAction: any = noop;

// Creators / portfolio
export const updateProfileAction: any = noop;
export const addPortfolioItemAction: any = noop;
export const deletePortfolioItemAction: any = noop;
export const movePortfolioItemAction: any = noop;

// Galleries
export const createGalleryAction: any = noop;
export const deleteGalleryAction: any = noop;
export const addImagesAction: any = noop;
export const removeImageAction: any = noop;
export const toggleSelectionAction: any = noop;
export const readVisitorId: any = async () => null;

// Inquiries
export const submitInquiryAction: any = noop;

// Jobs
export const postJobAction: any = noop;
export const markJobFilledAction: any = noop;
export const closeJobAction: any = noop;
export const setApplicationStatusAction: any = noop;
export const applyToJobAction: any = noop;
export const withdrawApplicationAction: any = noop;

// Messages
export const startThreadAction: any = noop;
export const sendMessageAction: any = noop;
export const markThreadReadAction: any = async () => undefined;
export const findExistingThread: any = async () => null;

// Contracts
export const updateContractSectionsAction: any = noop;
export const signAsCreatorAction: any = noop;
export const cancelContractAction: any = noop;
export const signAsClientAction: any = noop;

// Quotes
export const createQuoteAction: any = noop;
export const sendQuoteAction: any = noop;
export const deleteQuoteAction: any = noop;
export const approveQuoteAction: any = noop;
export const rejectQuoteAction: any = noop;

// Store
export const createProductAction: any = noop;
export const updateProductAction: any = noop;
export const setProductStatusAction: any = noop;
export const purchaseProductAction: any = noop;

// Spaces (studio rentals)
export const createSpaceAction: any = noop;
export const updateSpaceAction: any = noop;
export const setSpaceStatusAction: any = noop;
export const bookSpaceAction: any = noop;
export const cancelBookingAction: any = noop;

// Blog
export const createPostAction: any = noop;
export const updatePostAction: any = noop;
export const deletePostAction: any = noop;
export const publishPostAction: any = noop;

// Theme
export const setTheme: any = noop;

// Active role (multi-role accounts)
export const setActiveRole: any = noop;

// Studio public profile
export const createStudioProfileAction: any = noop;
export const updateStudioProfileAction: any = noop;

// Moderation
export const reportContentAction: any = noop;
export const blockUserAction: any = noop;
export const unblockUserAction: any = noop;
export const getBlockedUsersAction: any = async () => [];
export const getBlockedUserIdsAction: any = async () => [];
export const isBlockedAction: any = async () => false;
export const listPendingReportsAction: any = async () => [];
export const reviewReportAction: any = noop;
