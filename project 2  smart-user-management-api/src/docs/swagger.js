const swaggerJSDoc = require('swagger-jsdoc');
const config = require('../config/env');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Smart User Management REST API',
    version: '1.0.0',
    description:
      'A production-ready backend REST API for user management, featuring JWT authentication, ' +
      'role-based access control, pagination/search/filter/sort, profile image uploads, and audit logging. ' +
      'Built for the DecodeLabs Full Stack Development Internship (Project 2).',
    contact: {
      name: 'DecodeLabs Intern',
      email: 'support@smartuserapi.com',
    },
    license: { name: 'MIT' },
  },
  servers: [
    { url: `http://localhost:${config.port}/api/${config.apiVersion}`, description: 'Local development server' },
    { url: `https://your-app.onrender.com/api/${config.apiVersion}`, description: 'Production (Render) example' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password', 'age', 'phoneNumber'],
        properties: {
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane.doe@example.com' },
          password: { type: 'string', example: 'Jane@1234' },
          age: { type: 'integer', example: 25 },
          phoneNumber: { type: 'string', example: '+919876543210' },
          role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
              country: { type: 'string' },
            },
          },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'jane.doe@example.com' },
          password: { type: 'string', example: 'Jane@1234' },
        },
      },
      UpdateUserInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          age: { type: 'integer' },
          phoneNumber: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'user'] },
          isActive: { type: 'boolean' },
        },
      },
      ApiSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: { type: 'object' },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // JSDoc comments in route files are parsed for docs
};

module.exports = swaggerJSDoc(options);
