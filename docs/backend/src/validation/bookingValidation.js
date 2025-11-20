const Joi = require('joi');

const createBookingSchema = Joi.object({
  tripId: Joi.string().uuid().required().messages({
    'string.uuid': 'Trip ID must be a valid UUID',
    'any.required': 'Trip ID is required'
  }),
  seats: Joi.array()
    .items(Joi.number().integer().min(1).max(100))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one seat must be selected',
      'any.required': 'Seats are required'
    }),
  passengerName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Passenger name must be at least 2 characters',
    'string.max': 'Passenger name must not exceed 100 characters',
    'any.required': 'Passenger name is required'
  }),
  passengerEmail: Joi.string().email().required().messages({
    'string.email': 'Invalid email address',
    'any.required': 'Passenger email is required'
  }),
  passengerPhone: Joi.string()
    .pattern(/^\+?[0-9]{8,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid phone number format',
      'any.required': 'Passenger phone is required'
    }),
  paymentMethod: Joi.string()
    .valid('CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER')
    .required()
    .messages({
      'any.only': 'Invalid payment method',
      'any.required': 'Payment method is required'
    })
});

const updateBookingSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'COMPLETED', 'REFUNDED')
    .required()
    .messages({
      'any.only': 'Invalid booking status',
      'any.required': 'Status is required'
    })
});

const cancelBookingSchema = Joi.object({
  reason: Joi.string().max(500).optional().messages({
    'string.max': 'Reason must not exceed 500 characters'
  })
});

module.exports = {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema
};
