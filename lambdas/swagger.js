const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'URL Shortener API',
            version: '0.0.1',
        },
    },
    apis: ['./api/**/*.ts'],
};

console.log(JSON.stringify(swaggerJsdoc(options)));
