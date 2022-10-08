export function showMessage(text, title, icon = 'warning'){
    swal({
        title: title,
        text:text,
        icon: icon,
        button: 'Got it',
    })
}

export async function getQuestionnaireResponse(parameter, value){
    let responses = null;
    await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse?".concat(parameter,"='", value, "'"))
        .then(response => checkFetch(response))
        .then(response => response.json())
        .then(async fhirQ => {
            responses = fhirQ
        })
        .catch((error) =>{
            error = error.toString()
                console.error(error)
                if(error.includes("Failed to fetch"))
                    alert("Problem with loading content, please check your connection.\n");
                else showMessage("Encountered an internal system error, unable to load questionnaire", "Problem Loading Questionnaire", "error")
        });
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

// async function handleResponse(qName, presentQuestionnaireFunc, isFormCompleted, encounterID, patientID, responsesUnderThresholdArray = null){
//     let response = LForms.Util.getFormFHIRData("QuestionnaireResponse", "R4");
//     let validationMsg;
//     if(!response.item){
//         validationMsg = "None of the questions were answered, please review the questionnaire again."
//     }
//     else {
//         validationMsg = LForms.Util.checkValidity('formContainer')
//         if(validationMsg){
//             validationMsg = utilities.adjuctErrors(validationMsg)
//         }
//         else{
//             if(qName === "followup")
//                 validationMsg = utilities.answersValidation(response)
//         }
//     }
//     if(validationMsg) {
//         swal({
//             title: "Invalid Response",
//             text: validationMsg,
//             icon: "warning",
//             button: "Got it",
//         })
//     }
//     else {
//         try{
//             utilities.handleLoadingSubmitButton()
//             if(!encounterID) { //first time of getting encounterID
//                 encounterID = await utilities.getEncounterID(patientID, response, qDetails)
//                 if(!encounterID)
//                     throw Error("Error creating encounter_id")
//             }
//             response.subject = {"reference": "Patient/".concat(patientID)};
//             console.log(response.subject, encounterID)
//             response.extension = {
//                 "score": await utilities.getScore(response),
//                 "questionnaire_id": questions_id,
//                 "encounter_id": encounterID,
//             }
//             // utilities.postQuestionnaireResponse(response)
//
//             // downloadResponseAsFile(response, "response_testing_followup")
//             console.log(response);
//             let displaySelfAssessment = []
//             if(qName === "followup")
//                 displaySelfAssessment = utilities.checkResponseOfBaseline(response, qDetails, responsesUnderThresholdArray)
//             if (displaySelfAssessment){
//                 qName = displaySelfAssessment.splice(0, 1)[0]
//                 let lastQuestionnaire = !displaySelfAssessment.length
//                 if(qName){
//                     document.getElementById("submitButton").remove();
//                     presentQuestionnaireFunc(qName, lastQuestionnaire, isFormCompleted)
//                 }
//                 else {
//                     isFormCompleted = true
//                     window.location.replace("approval.html");  //Need to do only if approval was sent from the post
//                 }
//             }
//         }
//         catch (error){
//             utilities.handleUnLoadingSubmitButton()
//             error = error.toString()
//             console.error(error.toString())
//             if(error.includes("Failed to fetch"))
//                 alert("Problem with loading content, please check your connection.\n");
//             else showMessage("Encountered an internal server error, response wasn't sent", "Error while Submitting Response", "error")
//         }
//     }
// }

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
        .then(result => checkFetch(result))
        .then(response => response.json())
        .then(async result => {
            encounterID = result.encounter_id
        })
        .catch((error) =>{
            error = error.toString()
            console.error(error)
            if(error.includes("Failed to fetch"))
                alert("Problem with loading content, please check your connection.\n");
        });
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

export function handleUnLoadingSubmitButton(){
    let button = document.getElementById("submitButton")
    let spinner = document.getElementById("loadingSpinner")
    spinner.hidden = true;
    button.disabled = false;
}

export function removeSpinnerDiv(){
    const element = document.getElementById("spinnerDiv");
    element.remove();
}


export function adjuctErrors(errors){
    let result = "Please answer the following question(s) before continuing:\n"
    for (let i = 0; i < errors.length; i++){
        result = result.concat("- "+errors[i].split("requires")[0].split("(")[0]+"\n");
    }
    return result
}

export function answersValidation(response){
    let result = "";
    let missingMeds = medicationsValidation(response)
    if(missingMeds)
        result = result.concat(missingMeds)
    let symptoms = symptomsValidationMain(response)
    if(symptoms)
        result = result.concat(symptoms)
    return result
}

export function medicationsValidation(response) {
    // check for missing medications at clinical conditions question
    let answers = response.item[1].item
    let medsMissing = []
    for (let i = 1; i < answers.length; i++){
        for(let j = 2 ; j < 4 ; j++) {
            if(answers[i].item[j].text.includes("medication")){
                let isTakingMeds = answers[i].item[j].answer[0].valueCoding.display
                if(isTakingMeds === "Yes"){
                    if(answers[i].item[j+1] === undefined){
                        medsMissing.push(answers[i].text.split("Diagnosis Details")[0].trim())
                    }
                }
                break;
            }
        }
    }
    let result = ""
    if(medsMissing.length !== 0)
        result = "- Missing medications for the following clinical condition(s):\n".concat(
            medsMissing.join(", ")
        );
    // check for missing medications in the 'not listed medications' question (last one)
    let otherMedications = response.item[response.item.length - 1].item
    if(otherMedications[0].answer[0].valueCoding.display === "Yes"){
        if(otherMedications[1] === undefined){
            if(result.length !== 0)
                result = result.concat("\n")
            result = result.concat("- You replied 'Yes' for taking not listed medications, please fill at least one medication.")
        }
    }
    return result
}

function symptomsValidationMain(response){
    let questionsDetails = {
        0: {'questionName': 'Active Symptoms', 'phrase':'No Symptoms'},
        1: {'questionName': 'Clinical Condition(s) - Part A', 'phrase':'I have never suffered from any of the conditions listed above'},
        2: {'questionName': 'Clinical Condition(s) - Part B', 'phrase':'I have never suffered from any of the conditions listed above'}
    }
    let result = ""
    for(let i = 0; i < 3; i++){
        let answers = response.item[i].item[0].answer
        let answersArray = []
        for(let j = 0; j < answers.length; j++)
            answersArray.push(answers[j].valueCoding.display)
        let symptomsResult = symptomsValidationSub(answersArray, questionsDetails[i].phrase, questionsDetails[i].questionName)
        result = result.concat(symptomsResult)
    }
    return result
}

function symptomsValidationSub(answersArray, phrase, question){
    let result = ""
    if(answersArray.includes(phrase) && answersArray.length > 1){
        var index = answersArray.indexOf(phrase);
        if (index !== -1) {
            answersArray.splice(index, 1);
        }
        let symptoms = ""
        for(let j = 0; j < answersArray.length; j++){
            if( j !== answersArray.length - 1)
                symptoms = symptoms.concat("'" + answersArray[j] + "', ")
            else symptoms = symptoms.concat("'" + answersArray[j] + "'")
        }
        result = result.concat(question + " - can't have '" + phrase + "' and " + symptoms + " as answers")
    }
    return result
}

export function checkFetch(response) {
    let errorText = ""
    if (!response.ok) {
        if (response.statusText.includes("Failed to fetch") || response.status === 404){
            errorText = "Problem with loading content, please check your connection.\n";
        }
        else if(response.status === 400)
            errorText = "Error with request's parameters[" + response.status + "]\n"
        else if (response.status === 403)
            errorText = "Problem with fetching content, please check the fetch url\n";
        else {
            errorText = "Problem with request [" + response.status + "]\n"
        }
        console.log(errorText)
        throw Error(errorText)
    }
    return response
}



export async function postQuestionnaireResponse(response){
    let statusCode = ""
    await fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse', {
        method: 'POST',
        body: JSON.stringify(response),
        headers: {'Content-Type': 'application/json'}
        })
        .then(result =>  checkFetch(result))
        .then(async result => {
            let response = await result.json()
            console.log(response)
            return result.status
        })
        .then(async result => {
            statusCode = result
        })
        .catch((error) =>{
            error = error.toString()
            console.error(error)
            if(error.includes("Failed to fetch"))
                alert("Problem with loading content, please check your connection.\n");
        });
    return statusCode;
}

function downloadResponseAsFile(response, fileName){
    const a = document.createElement("a");
    const file = new Blob([JSON.stringify(response,null,4)], {type : 'application/json'});
    a.href = URL.createObjectURL(file);
    a.download = fileName+'.json';
    a.click();
}





