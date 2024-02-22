export class ValidationError extends Error {
    constructor(public readonly message: string) {
        super(message);
    }
}

export class Validator<T extends Record<string, unknown>> {
    constructor(private readonly body: T) {}

    mustBeProvided(fieldName: string): Validator<T> {
        const value = this.body[fieldName];
        if (value === undefined || value === null) {
            throw new ValidationError(`${fieldName} must be provided`);
        }

        return this;
    }

    mustBeString(fieldName: string): Validator<T> {
        const value = this.body[fieldName];
        if (typeof value !== 'string') {
            throw new ValidationError(`${fieldName} must be a string`);
        }

        return this;
    }

    mustHaveLengthBetween(fieldName: string, min: number, max: number): Validator<T> {
        const value = this.body[fieldName] as { length: number };

        if (value.length < min) {
            throw new ValidationError(`${fieldName} must have at least ${min} characters`);
        }

        if (value.length > max) {
            throw new ValidationError(`${fieldName} must have at most ${max} characters`);
        }

        return this;
    }

    mustBeAlphanumericUnderscore(fieldName: string): Validator<T> {
        const value = this.body[fieldName] as string;
        if (!/^\w+$/.test(value)) {
            throw new ValidationError(`${fieldName} must contain only letters, numbers and underscores`);
        }

        return this;
    }
}
