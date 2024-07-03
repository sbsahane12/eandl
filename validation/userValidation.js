const Joi = require('joi');


const emailSchema = Joi.object({
    email: Joi.string().email().required()
        .messages({
            'string.email': 'Please enter a valid email address',
            'string.empty': 'Email address is required',
            'any.required': 'Email address is required'
        })
});

const passwordResetSchema = Joi.object({
    token: Joi.string().required()
        .messages({
            'string.empty': 'Reset token is required',
            'any.required': 'Reset token is required'
        }),
    password: Joi.string().min(6).required()
        .messages({
            'string.empty': 'New password is required',
            'string.min': 'Password must be at least 6 characters long',
            'any.required': 'New password is required'
        })
});

const userSchema = Joi.object({
    username: Joi.string().min(3).max(30).required()
    .pattern(new RegExp('^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .messages({
        'string.base': 'Username must be a text string',
        'string.empty': 'Username is required',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'string.pattern.base': 'Username must contain at least one uppercase letter, one number, and one special character',
        'any.required': 'Username is required'
    }),
        name: Joi.string().min(2).max(50).required().custom((value, helpers) => {
            if (value.split(' ').length < 3) {
                return helpers.message('Enter Full Name with atleast 3 words');
            }
            return value;
        })
        .messages({
            'string.base': 'Name must be a text string',
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 50 characters',
            'any.required': 'Name is required'
        }),
    accountNumber: Joi.string().pattern(/^[0-9]{14}$/).required()
        .messages({
            'string.pattern.base': 'Account number must be 14 digits long',
            'string.empty': 'Account number is required',
            'any.required': 'Account number is required'
        }),
    email: Joi.string().email().required()
        .messages({
            'string.email': 'Please enter a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        }),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required()
        .messages({
            'string.pattern.base': 'Mobile number must be 10 digits long',
            'string.empty': 'Mobile number is required',
            'any.required': 'Mobile number is required'
        }),
    role: Joi.string().valid('admin', 'user').required()
        .messages({
            'any.only': 'Role must be either admin or user',
            'string.empty': 'Role is required',
            'any.required': 'Role is required'
        }),
        password: Joi.string().min(8).required().pattern(new RegExp('^(?=.*[A-Z])(?=.*[!@#$%^&*])'))
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.empty': 'Password is required',
            'string.pattern.base': 'Password must contain at least one uppercase letter and one special character',
            'any.required': 'Password is required'
        }),
 
    startYear: Joi.number().integer().min(1900).max(2100).required()
        .messages({
            'number.base': 'Start year must be a number',
            'number.integer': 'Start year must be an integer',
            'number.min': 'Start year must be 1900 or later',
            'number.max': 'Start year cannot be after 2100',
            'any.required': 'Start year is required'
        }),
    endYear: Joi.number().integer().min(1900).max(2100).required()
        .messages({
            'number.base': 'End year must be a number',
            'number.integer': 'End year must be an integer',
            'number.min': 'End year must be 1900 or later',
            'number.max': 'End year cannot be after 2100',
            'any.required': 'End year is required'
        }),
    is_verified: Joi.boolean().default(false)
        .messages({
            'boolean.base': 'Verification status must be true or false'
        }),


});


const userLoginSchema = Joi.object({
    email: Joi.string().email().required()
        .messages({
            'string.email': 'Please enter a valid email address',
            'string.empty': 'Email address is required',
            'any.required': 'Email address is required'
        }),
    username: Joi.string().min(3).max(30).required()
        .messages({
            'string.base': 'Username must be a text string',
            'string.empty': 'Username is required',
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username cannot exceed 30 characters',
            'string.alphanum': 'Username must only contain alphanumeric characters',
            'any.required': 'Username is required'
        }),
    password: Joi.string().min(6).required()
        .messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        })
});


const schemeSchema = Joi.object({
    schemeName: Joi.string().min(3).max(100).required()
        .messages({
            'string.min': 'Scheme name must be at least 3 characters long',
            'string.max': 'Scheme name cannot exceed 100 characters',
            'string.empty': 'Scheme name is required',
            'any.required': 'Scheme name is required'
        }),
    schemeType: Joi.string().valid('ground', 'department').required()
        .messages({
            'any.only': 'Scheme type must be either ground or department',
            'string.empty': 'Scheme type is required',
            'any.required': 'Scheme type is required'
        }),
    hoursWorked: Joi.number().required()
        .messages({
            'number.base': 'Hours worked must be a number',
            'number.empty': 'Hours worked is required',
            'any.required': 'Hours worked is required'
        }),
    date: Joi.date().iso().required()
        .messages({
            'date.base': 'Please enter a valid date',
            'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
            'any.required': 'Date is required'
        }),
    year: Joi.number().integer().min(1900).max(2100).required()
        .messages({
            'number.base': 'Year must be a number',
            'number.integer': 'Year must be an integer',
            'number.min': 'Year must be 1900 or later',
            'number.max': 'Year cannot be after 2100',
            'any.required': 'Year is required'
        }),

        selectedUsers: Joi.any().messages({
            'any.required': 'At least one user must be selected'
        }),
        completed: Joi.boolean().default(false)
});

const updateSchemeSchema = Joi.object({
    schemeName: Joi.string().min(3).max(100).required()
        .messages({
            'string.min': 'Scheme name must be at least 3 characters long',
            'string.max': 'Scheme name cannot exceed 100 characters',
            'string.empty': 'Scheme name is required',
            'any.required': 'Scheme name is required'
        }),
    schemeType: Joi.string().valid('ground', 'department').required()
        .messages({
            'any.only': 'Scheme type must be either ground or department',
            'string.empty': 'Scheme type is required',
            'any.required': 'Scheme type is required'
        }),
    hoursWorked: Joi.number().positive().required()
        .messages({
            'number.base': 'Hours worked must be a number',
            'number.positive': 'Hours worked must be a positive number',
            'number.empty': 'Hours worked is required',
            'any.required': 'Hours worked is required'
        }),
    date: Joi.date().iso().required()
        .messages({
            'date.base': 'Please enter a valid date',
            'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
            'any.required': 'Date is required'
        }),
    completed: Joi.boolean().required()
        .messages({
            'boolean.base': 'Completed status must be true or false',
            'any.required': 'Completed status is required'
        })
});

const yearSchema = Joi.object({
    year: Joi.number().integer().min(1900).max(2100).required()
        .messages({
            'number.base': 'Year must be a number',
            'number.integer': 'Year must be an integer',
            'number.min': 'Year must be 1900 or later',
            'number.max': 'Year cannot be after 2100',
            'any.required': 'Year is required'
        })
});

const monthYearSchema = Joi.object({
    year: Joi.number().integer().min(1900).max(2100).required()
        .messages({
            'number.base': 'Year must be a number',
            'number.integer': 'Year must be an integer',
            'number.min': 'Year must be 1900 or later',
            'number.max': 'Year cannot be after 2100',
            'any.required': 'Year is required'
        }),
    month: Joi.number().integer().min(1).max(12).required()
        .messages({
            'number.base': 'Month must be a number',
            'number.integer': 'Month must be an integer',
            'number.min': 'Month must be between 1 and 12',
            'number.max': 'Month must be between 1 and 12',
            'any.required': 'Month is required'
        })
});

module.exports = {
    userSchema,
    schemeSchema,
    updateSchemeSchema,
    yearSchema,
    monthYearSchema,
    emailSchema,
    passwordResetSchema,
    userLoginSchema
};


