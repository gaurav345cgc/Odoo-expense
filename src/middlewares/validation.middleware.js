const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }

    // Replace the request property with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Expense creation schema
const createExpenseSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required()
    .messages({
      'number.positive': 'Amount must be greater than 0',
      'number.precision': 'Amount can have maximum 2 decimal places',
      'any.required': 'Amount is required'
    }),
  
  currency: Joi.string().length(3).uppercase().required()
    .messages({
      'string.length': 'Currency must be a 3-letter code',
      'any.required': 'Currency is required'
    }),
  
  category: Joi.string().valid(
    'TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORT', 'ENTERTAINMENT',
    'OFFICE_SUPPLIES', 'TRAINING', 'CLIENT_MEETING', 'OTHER'
  ).required()
    .messages({
      'any.only': 'Category must be one of the valid expense categories',
      'any.required': 'Category is required'
    }),
  
  description: Joi.string().min(1).max(1000).trim().required()
    .messages({
      'string.min': 'Description cannot be empty',
      'string.max': 'Description must be less than 1000 characters',
      'any.required': 'Description is required'
    }),
  
  date: Joi.date().max('now').required()
    .messages({
      'date.max': 'Date cannot be in the future',
      'any.required': 'Date is required'
    }),
  
  receiptUrl: Joi.string().uri().optional().allow('')
    .messages({
      'string.uri': 'Receipt URL must be a valid URL'
    })
});

// Expense update schema
const updateExpenseSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional()
    .messages({
      'number.positive': 'Amount must be greater than 0',
      'number.precision': 'Amount can have maximum 2 decimal places'
    }),
  
  currency: Joi.string().length(3).uppercase().optional()
    .messages({
      'string.length': 'Currency must be a 3-letter code'
    }),
  
  category: Joi.string().valid(
    'TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORT', 'ENTERTAINMENT',
    'OFFICE_SUPPLIES', 'TRAINING', 'CLIENT_MEETING', 'OTHER'
  ).optional()
    .messages({
      'any.only': 'Category must be one of the valid expense categories'
    }),
  
  description: Joi.string().min(1).max(1000).trim().optional()
    .messages({
      'string.min': 'Description cannot be empty',
      'string.max': 'Description must be less than 1000 characters'
    }),
  
  date: Joi.date().max('now').optional()
    .messages({
      'date.max': 'Date cannot be in the future'
    }),
  
  receiptUrl: Joi.string().uri().optional().allow('')
    .messages({
      'string.uri': 'Receipt URL must be a valid URL'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Query parameters schema for getting expenses
const getExpensesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED').optional()
    .messages({
      'any.only': 'Status must be one of: PENDING, APPROVED, REJECTED, CANCELLED'
    }),
  
  category: Joi.string().valid(
    'TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORT', 'ENTERTAINMENT',
    'OFFICE_SUPPLIES', 'TRAINING', 'CLIENT_MEETING', 'OTHER'
  ).optional()
    .messages({
      'any.only': 'Category must be one of the valid expense categories'
    }),
  
  startDate: Joi.date().optional()
    .messages({
      'date.base': 'Start date must be a valid date'
    }),
  
  endDate: Joi.date().optional()
    .messages({
      'date.base': 'End date must be a valid date'
    }),
  
  sortBy: Joi.string().valid('createdAt', 'date', 'amount', 'status', 'category').default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: createdAt, date, amount, status, category'
    }),
  
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    })
}).custom((value, helpers) => {
  // Validate date range
  if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
    return helpers.error('date.range', { startDate: value.startDate, endDate: value.endDate });
  }
  return value;
}).messages({
  'date.range': 'Start date cannot be after end date'
});

// Statistics query schema
const statisticsQuerySchema = Joi.object({
  startDate: Joi.date().optional()
    .messages({
      'date.base': 'Start date must be a valid date'
    }),
  
  endDate: Joi.date().optional()
    .messages({
      'date.base': 'End date must be a valid date'
    }),
  
  category: Joi.string().valid(
    'TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORT', 'ENTERTAINMENT',
    'OFFICE_SUPPLIES', 'TRAINING', 'CLIENT_MEETING', 'OTHER'
  ).optional()
    .messages({
      'any.only': 'Category must be one of the valid expense categories'
    })
}).custom((value, helpers) => {
  // Validate date range
  if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
    return helpers.error('date.range', { startDate: value.startDate, endDate: value.endDate });
  }
  return value;
}).messages({
  'date.range': 'Start date cannot be after end date'
});

// MongoDB ObjectId validation
const objectIdSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format'
    })
});

// Export validation middleware functions
module.exports = {
  validate,
  validateCreateExpense: validate(createExpenseSchema, 'body'),
  validateUpdateExpense: validate(updateExpenseSchema, 'body'),
  validateGetExpensesQuery: validate(getExpensesQuerySchema, 'query'),
  validateStatisticsQuery: validate(statisticsQuerySchema, 'query'),
  validateObjectId: validate(objectIdSchema, 'params')
};