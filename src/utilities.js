


export async function getQuestionnaireResponse(parameter, value){
    let responses = null;
    await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse?".concat(parameter,"='", value, "'"))
        .then(response => response.json())
        .then(async fhirQ => {
            responses = fhirQ
        })
    return responses;
}

export function createButton(qName, lastQuestionnaire, handler){
    // lastQuestionnaire ? console.log(getEventListeners(window)) : null
    let div = document.getElementById("submitDiv");
    let btn = document.createElement("button");
    btn.innerHTML = !lastQuestionnaire ? "Submit and continue to the next form" : "Submit and finish"
    btn.className = "btn btn-primary"
    btn.id = "submitButton"
    btn.addEventListener("click", function(){
        handler(qName)
    });
    div.appendChild(btn)
    // let btn = document.getElementById("submitButton");
    // btn.removeAttribute("hidden");

    // btn.disabled = true;
}

export async function getScore(response) {
    let scoreIDs = await fetch("./resources/scoresIDS.json")
    scoreIDs = await scoreIDs.json()
    scoreIDs = scoreIDs.scoreIDs
    let lastQuestion = response.item[response.item.length - 1]
    let score;
    let linkID = lastQuestion.linkId
    if(scoreIDs.includes(linkID)){
        score = lastQuestion.answer[0].valueDecimal
        return Number.isInteger(score) ? score : null
    }
    return null
}

export function checkResponseOfBaseline(response, qDetails){
    // TODO: add check for partB as well
    let answersPartA = response.item[1].item[0].answer
    let displaySelfAssessment = []
    if(answersPartA){
        for (let i = 0; i < answersPartA.length; i++){
            let answer = answersPartA[i].valueCoding.code
            let condition = ifAnswerInSelfAssessment(answer, qDetails)
            if(condition)
                displaySelfAssessment.push(condition)
        }
    }
    if(!displaySelfAssessment.includes("PHQ-9"))
        displaySelfAssessment.push("PHQ-9")
    return displaySelfAssessment
}

function ifAnswerInSelfAssessment(answerCode, qDetails){
    let conditions = Object.keys(qDetails)
    conditions.splice(0,2)
    for(let i = 0; i < conditions.length; i++){
        let curr_code = qDetails[conditions[i]].aID
        if(curr_code === answerCode){
            return conditions[i]
        }
    }
    return null
}

export async function getEncounterID(patientId, response, qDetails) {
    let today = new Date()
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
    let encounterDate = date + ' ' + time
    let conditionsList = getConditionsList(response, qDetails)
    let encounterID = null
    let url = "https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/" +
        "test/create_questionnaire_encounter?".concat("encounter_date=", encounterDate, conditionsList, "&", "patient_id=", patientId)
    await fetch(url)
        .then(response => response.json())
        .then(async result => {
            encounterID = result.encounter_id
        })
    return encounterID
}

function getConditionsList(response, qDetails){
    let conditionsList = []
    let relevantQuestions = [response.item[1], response.item[2]]
    let qIDs = Object.keys(qDetails.baselineClinicalQuestions)
    for(let i = 0; i < relevantQuestions.length; i++){
        if(relevantQuestions[i].linkId === qDetails.baselineClinicalQuestions[qIDs[i]]) { //maybe redundant
            let answers = relevantQuestions[i].item[0].answer
            for (let j = 0; j < answers.length; j++) {
                conditionsList.push(answers[j].valueCoding.display)
            }
        }
    }
    if(conditionsList === []){ //maybe redundant
        throw "Conditions list is empty"
    }
    let conditionsListString = ""
    for(let i = 0; i < conditionsList.length; i++){
        conditionsListString += "&conditions="+conditionsList[i]
    }
    return conditionsListString
}