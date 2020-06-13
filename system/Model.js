/// Имитационная модель СМО
class Model {

    channels = 0; // Количество каналов
    maxQueueLength = 0; // Максимальная длина очереди
    timeWork = 0; // Время работы СМО
    timeStep = 0; // Шаг по времени
    jobsRate = 0; // Интенсивность получения заявок
    processRate = 0; // Интенсивность обработки заявок
    generator = {}; // Генератор СВ с заданным распределением

    channelState = []; // Время окончания обслуживания заявки во всех каналах
    channelJobAssigned = []; // Время окончания обслуживания заявки во всех каналах
    totalProcessingTime = 0.0; // Суммарное время обслуживания заявок
    timeInQueueStat = []; // Время пребывания СМО в состояниях с очередью
    currentQueueLength = 0; // Длина очереди

    requestEntryCount = 0; // Число поступивших заявок
    declinedRequestCount = 0; // Число отказанных заявок
    acceptedRequestCount = 0; // Число обслуженных заявок
    processingTime = 0;
    cancelProcess = false;

    /// <param name="channels">Количество каналов</param>
    /// <param name="length">Максимальная длина очереди</param>
    /// <param name="time">Время работы СМО</param>
    /// <param name="timeStep">Шаг по времени</param>
    /// <param name="jRate">Интенсивность получения заявок</param>
    /// <param name="pRate">Интенсивность обработки заявок</param>
    /// <param name="dist">Генератор СВ с заданным распределением</param>
    constructor(channels, length, time, timeStep, jRate, pRate, generator) {
        this.channels = channels;
        this.maxQueueLength = length;
        this.timeWork = time;
        this.timeStep = timeStep;
        this.jobsRate = jRate;
        this.processRate = pRate;
        this.generator = generator;
        this.cancelProcess = false;

        this.channelState = new Array(this.channels);
        this.channelJobAssigned = new Array(this.channels);
        this.timeInQueueStat = new Array(this.maxQueueLength + 1);

        // init arrays
        for (let i = 0 ; i < this.channelState.length; i ++) {
            this.channelState[i] = 0;
        }
        for (let i = 0 ; i < this.channelJobAssigned.length; i ++) {
            this.channelJobAssigned[i] = 0;
        }
        for (let i = 0 ; i < this.timeInQueueStat.length; i ++) {
            this.timeInQueueStat[i] = 0;
        }
    }

    /// Проверка на получение очередной заявки
    Request() {
        let r = this.generator.NextDouble();
        return r < this.jobsRate;
    }

    /// Получение времени обработки очередной заявки
    GetProcessTime() {
        let r = this.generator.NextDouble();
        return Math.abs(r) / this.processRate;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    pause() {
        this.cancelProcess = true;
    }

    resume() {
        this.cancelProcess = false;
    }

    /// Основной цикл работы СМО
    /// <param name="delay">Задержка на каждой итерации (мс)</param>
    /// <param name="progressBarsCallback">Callback для обновления UI</param>
    /// <param name="updateTextStateCallback">Callback для обновления UI</param>
    /// <param name="updateTotalProgressCallback">Callback для обновления UI</param>
    /// <returns>Полученные значения параметров в результате моделирования</returns>
    async Loop(delay, progressBarsCallback, updateTextStateCallback, updateTotalProgressCallback) {
        try {
            while (this.processingTime < this.timeWork)
            {
                if (this.cancelProcess) {
                    return;
                }

                this.processingTime += this.timeStep;
                this.timeInQueueStat[this.currentQueueLength] += this.timeStep;

                // Обновить интерфейс
                this.UpdateProgressBars(progressBarsCallback);
                this.UpdateTextBlock(updateTextStateCallback);
                this.UpdateTotalProgressBar(updateTotalProgressCallback)

                if (delay > 0) await this.sleep(delay);

                if (this.currentQueueLength > 0)
                {
                    this.timeInQueueStat[this.currentQueueLength - 1] += this.timeStep;
                    for (let i = 0; i < this.channels && this.currentQueueLength > 0; i++)
                    if (this.channelState[i] <= 0)
                    {
                        this.channelState[i] = this.GetProcessTime();
                        this.channelJobAssigned[i] = this.channelState[i];
                        this.totalProcessingTime += this.channelState[i];
                        this.currentQueueLength--;
                    }
                }

                if (this.Request())
                {
                    this.requestEntryCount++;
                    if (this.currentQueueLength < this.maxQueueLength)
                    {
                        this.acceptedRequestCount++;
                        if (this.IsThereFreeChannel) this.AssignJob();
                        else this.currentQueueLength++;
                    }
                    else this.declinedRequestCount++;
                }

                this.ProcessJobs();
            }
        } catch (e) {
            console.log(e)
        }
        return this.Statistics();
    }

    /// Проверка на наличие свободного канала
    get IsThereFreeChannel() {
        return this.channelState.filter(v => v > 0).length < this.channelState.length;
    }

    /// Выдача заявки в работу
    AssignJob() {
        for (let i = 0; i < this.channels; i++) {
            if (this.channelState[i] <= 0) {
                this.channelState[i] = this.GetProcessTime();
                this.totalProcessingTime += this.channelState[i];
                break;
            }
        }
    }

    /// Цикл обработки задач, полученных каналами
    ProcessJobs() {
        for (let i = 0; i < this.channels; i++) {
            if (this.channelState[i] > 0) {
                this.channelState[i] -= this.timeStep;
            }
        }
    }

    /// Получение параметров по запуску модели
    Statistics() {
        let parameters = {};

        let P = this.timeInQueueStat[this.timeInQueueStat.length - 1] / this.processingTime;
        parameters["Вероятность отказа в обслуживании"] = P;

        let Q = 1 - P;
        parameters["Относительная пропускная способность"] = Q;

        let A = this.jobsRate * Q;
        parameters["Абсолютная пропускная способность"] = A;

        let L0 = 0;
        for (let i = 1; i < this.timeInQueueStat.length; i++)
            L0 += i * this.timeInQueueStat[i] / this.processingTime;
        parameters["Среднее число заявок в очереди"] = L0;

        let T0 = L0 / this.jobsRate;
        parameters["Среднее время заявки в очереди"] = T0;

        let k = A / this.maxQueueLength;
        parameters["Среднее число занятых каналов"] = T0;

        parameters["Принято заявок"] = this.acceptedRequestCount;
        parameters["Из них в очереди"] = this.currentQueueLength;
        parameters["Отклонено заявок"] = this.declinedRequestCount;
        parameters["Всего заявок"] = this.requestEntryCount;

        parameters["Процент отказов"] = Math.round(this.declinedRequestCount / this.requestEntryCount * 100);

        parameters["Процент обработки"] = Math.round(this.acceptedRequestCount / this.requestEntryCount * 100);

        return parameters;
    }

    UpdateProgressBars(progressBarsCallback) {
        let states = [];
        for (let i = 0; i < this.channelJobAssigned.length; i++) {
            states.push({
                Maximum: this.channelJobAssigned[i],
                Value: this.channelState[i]
            });
        }

        progressBarsCallback(states);
    }

    UpdateTextBlock(updateTextStateCallback) {
        updateTextStateCallback(this.Statistics())
    }

    UpdateTotalProgressBar(updateTotalProgressCallback) {
        updateTotalProgressCallback({
            Maximum: this.timeWork,
            Value: this.processingTime
        });
    }
}

window.Model = Model;