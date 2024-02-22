const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');

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

fs.writeFileSync('swagger.json', JSON.stringify(swaggerJsdoc(options)));
