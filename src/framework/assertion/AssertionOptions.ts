
export interface AssertionOptions {
    withinMillis: number;
}

export class AssertionBuilder {

    public options: AssertionOptions;

    constructor(public n: number) {
        this.options = {
            withinMillis: n,
        };
    }

    get seconds(): this {
        this.options = {
            withinMillis: this.n * 1000,
        };
        return this;
    }
}

export function within(n: number): AssertionBuilder {
    return new AssertionBuilder(n);
}
