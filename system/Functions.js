function selectDistribution(event) {
    const {value} = event;
    if (value == null) return;

    if (value === "Нормальное распределение") {
        killProcess();
        setVisibility("NormalDistributionSP", true);
        setVisibility("PoissonDistributionSP", false);
    } else if (value === "Распределение Пуассона") {
        killProcess();
        setVisibility("NormalDistributionSP", false);
        setVisibility("PoissonDistributionSP", true);
        start();
    } else if (value === "Экспоненциальное распределение") {
        killProcess();
        setVisibility("NormalDistributionSP", false);
        setVisibility("PoissonDistributionSP", true);
    }
}

function setVisibility(className, visible) {
    const elements = document.getElementsByClassName(className);

    for(let i = 0 ; i < elements.length; i++) {
        elements[i].style.display = visible ? "" : "none";
    }
}

function getValueById(id) {
    const element = document.getElementById(id);
    return element.value;
}
function get(id) {
    return parseFloat(getValueById(id))
}

function start() {
    killProcess();

    let distribution = null;
    let selectedDistribution = getValueById("distLawLB");

    const systemInfo = document.getElementById("systemInfo");

    if (selectedDistribution === "Нормальное распределение") {
        distribution = new window.NormalGenerator(get("muDistTB"), get("sigmaDistTB"));
        systemInfo.innerText = "Время работы с заявоками системы массового обслуживания c нормальным законом распределения";
    } else if (selectedDistribution === "Экспоненциальное распределение") {
        distribution = new window.ExponentialGenerator(get("lambdaDistTB"));
        systemInfo.innerText = "Время работы с заявоками системы массового обслуживания c экспоненциальным законом распределения";
    } else if (selectedDistribution === "Распределение Пуассона") {
        distribution = new window.PoissonGenerator(get("lambdaDistTB"));
        systemInfo.innerText = "Время работы с заявоками системы массового обслуживания c законом распределения Пуассона";
    }
    // create bars
    createBars(get("nTB"));

    // console.log(distribution.NextDouble());
    let delay = get("delayTB");
    window.currentModel = new window.Model(get("nTB"), get("mTB"), get("timeTB"), get("dtTB"), get("lambdaTB"), get("muTB"), distribution);
    window.currentModel.Loop(delay, progressBarsCallback, updateTextStateCallback, updateTotalProgressCallback)

}

function setLabelForSystemInfo(value) {
    let selectedDistribution = getValueById("distLawLB");

    const systemInfo = document.getElementById("systemInfo");

    if (selectedDistribution === "Нормальное распределение") {
        systemInfo.innerText = "Время работы с заявоками системы массового обслуживания c нормальным законом распределения: " + value;
    } else if (selectedDistribution === "Экспоненциальное распределение") {
        systemInfo.innerText = "Время работы с заявоками системы массового обслуживания c экспоненциальным законом распределения: " + value;
    } else if (selectedDistribution === "Распределение Пуассона") {
        systemInfo.innerText = "Время работы с заявоками системы массового обслуживания c законом распределения Пуассона: " + value;
    }
}

function killProcess() {
    setVisibility("resumeButton", false);
    setVisibility("pauseButton", true);

    if (window.currentModel) {
        window.currentModel.pause();
    }
}

function pause() {
    window.currentModel.pause();
    setVisibility("resumeButton", true);
    setVisibility("pauseButton", false);
}

function resume() {
    window.currentModel.resume();
    setVisibility("resumeButton", false);
    setVisibility("pauseButton", true);
    let delay = get("delayTB");
    window.currentModel.Loop(delay, progressBarsCallback, updateTextStateCallback, updateTotalProgressCallback);
}

function createBars(count) {
    const element = document.getElementById("barsStates");
    let barsHtml = "";
    for(let i = 0 ; i < count; i++) {
        barsHtml += `<h5><span class="badge badge-primary" id="labelProgressBar-${i}">Состояние канала: </span></h5>\n`;
    }

    element.innerHTML = barsHtml;
}

function progressBarsCallback(bars) {
    for(let i = 0 ; i < bars.length; i++) {
        //const element = document.getElementById(`progressBar-${i}`);
        const elementLabel = document.getElementById(`labelProgressBar-${i}`);

        var procent = getProcent( bars[i].Value, bars[i].Maximum);
        elementLabel.innerText=`Процент загрузки канала ${i} составляет ${procent}%`;
    }
}

function getProcent(value, max) {
    if(isNaN(max) || isNaN(max) || isNaN(value) || isNaN(value) || (value/max) === Infinity){
        return 0;
    } else{
        return ((value/max) * 100).toFixed(3);
    }
}

function updateTextStateCallback(value) {
    const element = document.getElementById("details");
    let details = "";
    Object.keys(value).forEach(key => {
        details += `<span class="badge badge-light">${key}: </span><span class="badge badge-light" style="float:right;">${Math.round((value[key] + Number.EPSILON) * 100) / 100}</span><br/>`;
    });

    element.innerHTML = details;
}

function updateTotalProgressCallback(value) {
    const element = document.getElementById("totalProgress");
    if (value.Maximum && value.Maximum !== element.max) {
        element.max = value.Maximum;
    }
    element.value = value.Value;
    const systemInfo = document.getElementById("systemInfo");
    setLabelForSystemInfo(Number((value.Value).toFixed(6)));
}