export class ValidationError extends Error {
    constructor(public readonly message: string) {
        super(message);
    }
}

export class Validator<T extends Record<string, unknown>> {
    constructor(private readonly data: T) {}

    static fromJSON<T>(data: string): Validator<Partial<T>> {
        return new Validator(JSON.parse(data));
    }

    mustBeProvided<K extends keyof T>(fieldName: K): Validator<T & Required<Pick<T, K>>> {
        const value = this.data[fieldName];
        if (value === undefined || value === null) {
            throw new ValidationError(`${fieldName.toString()} must be provided`);
        }

        return this as unknown as Validator<T & Required<Pick<T, K>>>;
    }

    mustBeString<K extends keyof T>(fieldName: K): Validator<T> {
        const value = this.data[fieldName];
        if (typeof value !== 'string') {
            throw new ValidationError(`${fieldName.toString()} must be a string`);
        }

        return this;
    }

    mustBeUrl<K extends keyof T>(fieldName: K): Validator<T> {
        const value = this.data[fieldName];
        const urlRe =
            /^(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?$/;

        if (!urlRe.test(value as string)) {
            throw new ValidationError(`${fieldName.toString()} must be an url`);
        }

        return this;
    }

    mustHaveLengthBetween<K extends keyof T>(fieldName: K, min: number, max: number): Validator<T> {
        const value = this.data[fieldName] as { length: number };

        if (value.length < min) {
            throw new ValidationError(`${fieldName.toString()} must have at least ${min} characters`);
        }

        if (value.length > max) {
            throw new ValidationError(`${fieldName.toString()} must have at most ${max} characters`);
        }

        return this;
    }

    mustBeAlphanumericUnderscore<K extends keyof T>(fieldName: K): Validator<T> {
        const value = this.data[fieldName] as string;
        if (!/^\w+$/.test(value)) {
            throw new ValidationError(`${fieldName.toString()} must contain only letters, numbers and underscores`);
        }

        return this;
    }

    mustBeNumericString<K extends keyof T>(fieldName: K): Validator<T> {
        const value = this.data[fieldName] as string;
        if (!/^\d+$/.test(value)) {
            throw new ValidationError(`${fieldName.toString()} must contain only numbers`);
        }

        return this;
    }

    isPresent<K extends keyof T>(key: K): boolean {
        return this.data[key] !== undefined;
    }

    asValue(): T {
        return this.data;
    }
}
