class ExponentialGenerator {
    lambda = 0;

    constructor(lambda) {
        this.Lambda = lambda;
    }

    get Lambda() {
        return this.lambda;
    }

    set Lambda(value) {
        this.lambda = value;
    }

    NextDouble() {
        return 1 - Math.pow(Math.E, -this.lambda * Math.random() * 6);
    }
}

window.ExponentialGenerator = ExponentialGenerator;