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
        let x = 0 ;
        while(x === 0) x = Math.random(); //Converting [0,1) to (0,1)
        return 1 - Math.pow(Math.E, -this.lambda * x * 6);
    }
}

window.ExponentialGenerator = ExponentialGenerator;