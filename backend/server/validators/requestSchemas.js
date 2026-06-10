const { z } = require('zod');

const objectIdPattern = /^[a-f\d]{24}$/i;

const optionalTrimmedString = z.string().trim().max(1000).optional();
const optionalNumber = (schema) =>
  z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return value;
  }, schema.optional());

// Coordinate validation: latitude (-90 to 90), longitude (-180 to 180)
const coordinatesSchema = z
  .array(z.number().finite())
  .length(2)
  .refine(([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90, {
    message: 'Invalid coordinates: longitude must be -180 to 180, latitude must be -90 to 90',
  });

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(128),
  location: z.string().trim().max(160).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

const createTripSchema = z.object({
  destination: z.string().trim().min(1).max(160),
  date: z.string().trim().min(1),
  budget: optionalNumber(z.coerce.number().finite().nonnegative()),
  description: optionalTrimmedString,
  maxMembers: optionalNumber(z.coerce.number().int().positive()),
  longitude: optionalNumber(z.coerce.number().finite().min(-180).max(180)),
  latitude: optionalNumber(z.coerce.number().finite().min(-90).max(90)),
});

const updateTripSchema = z.object({
  destination: z.string().trim().min(1).max(160).optional(),
  date: z.string().trim().min(1).optional(),
  budget: optionalNumber(z.coerce.number().finite().nonnegative()),
  description: optionalTrimmedString,
  maxMembers: optionalNumber(z.coerce.number().int().positive()),
  longitude: optionalNumber(z.coerce.number().finite().min(-180).max(180)),
  latitude: optionalNumber(z.coerce.number().finite().min(-90).max(90)),
});

const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: optionalTrimmedString,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(6).max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(128),
  newPassword: z.string().min(6).max(128),
});

const updateMatchPreferencesSchema = z.object({
  preferredDestinations: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  preferredDestination: z.string().trim().max(80).optional(),
  budgetMin: optionalNumber(z.coerce.number().finite().nonnegative()),
  budgetMax: optionalNumber(z.coerce.number().finite().nonnegative()),
  preferredBudget: optionalNumber(z.coerce.number().finite().nonnegative()),
  travelStyle: z.enum(['relaxed', 'adventure', 'cultural', 'any']).optional(),
  bio: z.string().trim().max(500).optional(),
});

const createReviewSchema = z.object({
  tripId: z.string().trim().regex(objectIdPattern, 'Trip id is invalid'),
  rating: z.coerce.number().int().min(1).max(5),
  comment: optionalTrimmedString,
});

// GPS location update schema
const updateGpsSchema = z.object({
  coordinates: coordinatesSchema,
  accuracy: optionalNumber(z.coerce.number().positive()),
});

// Update trip destination with coordinates
const updateTripDestinationSchema = z.object({
  destination: z.string().trim().min(1).max(160).optional(),
  destinationCoordinates: z
    .object({
      coordinates: coordinatesSchema,
    })
    .optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createTripSchema,
  updateTripSchema,
  createReviewSchema,
  updateReviewSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMatchPreferencesSchema,
  coordinatesSchema,
  updateGpsSchema,
  updateTripDestinationSchema,
};
