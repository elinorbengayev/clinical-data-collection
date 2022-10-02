


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
    let div = document.getElementById("submitDiv");
    let btn = document.createElement("button");
    btn.className = "btn btn-primary"
    btn.id = "submitButton"
    btn.innerHTML = !lastQuestionnaire ? "Submit and continue to the next form " : "Submit and finish "

    btn.addEventListener("click", function(){
        handler(qName)
    });
    let spinner = document.createElement("span")
    spinner.id = "loadingSpinner"
    spinner.className = "spinner-border spinner-border-sm"
    spinner.hidden = true
    btn.appendChild(spinner)

    div.appendChild(btn)
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

export function checkResponseOfBaseline(response, qDetails, responsesUnderThresholdArray = null){
    // TODO: add check for partB as well
    let answersPartA = response.item[1].item[0].answer
    let displaySelfAssessment = []
    if(answersPartA){
        for (let i = 0; i < answersPartA.length; i++){
            let answerCode = answersPartA[i].valueCoding.code
            let condition = ifAnswerInSelfAssessment(answerCode, qDetails)
            if(condition)
                displaySelfAssessment.push(condition)
        }
    }
    if(!responsesUnderThresholdArray){
        if(!displaySelfAssessment.includes("PHQ-9"))
            displaySelfAssessment.unshift("PHQ-9")
        else{
            let first = "PHQ-9";
            displaySelfAssessment.sort(function(x,y){ return x === first ? -1 : y === first ? 1 : 0; });
        }
    }
    if(responsesUnderThresholdArray){
        // Firstly, merge between answers and score threshold
        let standsInTimeRange = checkResponsesTimeRange(displaySelfAssessment, response, qDetails)
        let mergedArray = standsInTimeRange.concat(responsesUnderThresholdArray)
        displaySelfAssessment = mergedArray.filter((item, pos) => mergedArray.indexOf(item) === pos)
    }
    return displaySelfAssessment
}

function checkResponsesTimeRange(displaySelfAssessment, response, qDetails){
    let standsInTimeRange = []
    for(let i = 0; i < displaySelfAssessment.length; i++){
        let detailsQID = qDetails[displaySelfAssessment[i]].detailsQID
        let questions = response.item[1].item
        for(let j = 1; j < questions.length; j++){
            if(questions[j].linkId === detailsQID){
                let levelThreshold = qDetails[displaySelfAssessment[i]].timeRange
                let currentLevel  = qDetails.timeRangeAnswers[questions[j].item[1].answer[0].valueCoding.display]
                if(currentLevel <= levelThreshold)
                    standsInTimeRange.push(displaySelfAssessment[i])
            }
        }
    }
    return standsInTimeRange
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

function getCurrentTimestamp(){
    let today = new Date()
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
    return date + ' ' + time
}

export async function getEncounterID(patientId, response, qDetails) {
    let encounterDate = getCurrentTimestamp()
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

export function handleLoadingSubmitButton(){
    let button = document.getElementById("submitButton")
    let spinner = document.getElementById("loadingSpinner")
    spinner.hidden = false;
    button.disabled = true;
}

export function removeSpinnerDiv(){
    const element = document.getElementById("spinnerDiv");
    element.remove();
}


// function flatItem(item, dic, questions){
//     if(!item["item"]){
//         if(Array.isArray(item)){
//             for(let i = 0; i < item.length; i++){
//                 if(questions && item[i].required || !questions){
//                     dic[item[i].linkId] = item[i].text;
//                 }
//             }
//             return dic;
//         }
//         else{
//             if(questions && item.required || !questions)
//                 dic[item.linkId] = item.text;
//             return dic
//         }
//     }
//     else
//         return flatItem(item["item"], dic);
// }
//
// function extractDictOfItems(object, questions = true){
//     let items = object["item"];
//     let dic = {};
//     for(let i = 0; i < items.length; i++){
//         dic = flatItem(items[i], dic, questions);
//     }
//     return dic;
// }
//
// export function validationCheck(questions, response){
//     let missingQuestions = ""
//     if(!response.item){
//         missingQuestions = "None of the questions were answered, please review the questionnaire again."
//     }
//     else{
//         missingQuestions = "Please answer the following question(s) before continuing:\n"
//         let questionsDic = extractDictOfItems(questions)
//         console.log(questionsDic)
//         let answersDic = extractDictOfItems(response, false)
//         for(const question in questionsDic){
//             if(!answersDic.hasOwnProperty(question)){
//                 missingQuestions = missingQuestions.concat(questionsDic[question]+"\n");
//             }
//         }
//         console.log(missingQuestions);
//     }
//     return missingQuestions;
// }

export function adjuctErrors(errors){
    let result = "Please answer the following question(s) before continuing:\n\n"
    for (let i = 0; i < errors.length; i++){
        result = result.concat("- "+errors[i].split("requires")[0].split("(")[0]+"\n");
    }
    return result
}



