import * as utilities from "../src/utilities.js";

let questions_id, encounterID = null
let displaySelfAssessment = []
let responsesUnderThresholdArray, isFormCompleted;

//Get the all questionnaire details - ID, score threshold, time threshold, etc
let qDetails = await fetch("./resources/conditionToQID.json")
qDetails = await qDetails.json()

const patientID = window.location.search.substring(1).split("=")[2].split("&")[0];
const lastEncounterID = window.location.search.substring(1).split("=")[3];

//Get all previous responses from the previous encounter
//to present the user's answers and to display the compatible self-assessment questionnaire according to them
const allResponses = await utilities.getQuestionnaireResponse("encounter_id", lastEncounterID)

if(allResponses && patientID && lastEncounterID){
    responsesUnderThresholdArray = responsesUnderThreshold(allResponses, qDetails)
    isFormCompleted = false
    presentQuestionnaire("followup")
}
else{
    console.error("Problem with given url's parameters")
    utilities.showMessage("Encountered an internal system error, unable to load questionnaire", "Problem Loading Questionnaire", "error")
    utilities.showErrorDiv()
}

async function presentQuestionnaire(qName, lastQuestionnaire){
    let qID = qDetails[qName].qID
    let questionnaire = {}

    //adding handler in case of pressing the browser's reload or back buttons
    window.addEventListener('beforeunload', (event) => {
        if(!isFormCompleted)
            event.returnValue = 'There is unsaved response. Are you sure you want to leave?';
    });

    await fetch(
        "https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='".concat(qID,"'"))
        .then(response => response.json())
        .then(async result => {
            //the questionnaire is returned inside an array with single element
            questionnaire = result[0]
            questions_id = questionnaire.id
            return questionnaire;
        })
        .then(async questionnaire => {
            if (qName === "followup") {
                //convert the linkIds of the questionnaire according to the baseline
                await fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/linkid_convertor', {
                    method: 'POST',
                    body: JSON.stringify(questionnaire),
                    headers: {'Content-Type': 'application/json'}
                })
                    .then(response => utilities.checkFetch(response))
                    .then(response => response.json())
                    .then(async result => {
                        //merging the previous answers with the follow-up questionnaire (so the patient can update it)
                        questionnaire = LForms.Util.convertFHIRQuestionnaireToLForms(result, 'R4');
                        let qr = allResponses[0];
                        qr.item.splice(0, 1)
                        questionnaire = LForms.Util.mergeFHIRDataIntoLForms("QuestionnaireResponse", qr, questionnaire, "R4");
                        utilities.removeSpinnerDiv()
                        LForms.Util.addFormToPage(questionnaire, 'formContainer');
                        setTimeout(function () {
                            utilities.createSubmitButton(qName, lastQuestionnaire, handleResponse);
                        }, 1000);
                    })
            } else {
                //rest of self-assessment quetionnaire don't need special handling
                questionnaire = LForms.Util.convertFHIRQuestionnaireToLForms(questionnaire, 'R4');
                window.scrollTo(0, 0);
                LForms.Util.addFormToPage(questionnaire, 'formContainer');
                setTimeout(function () {
                    utilities.createSubmitButton(qName, lastQuestionnaire, handleResponse);
                }, 1000);
            }
        })
        .catch((error) => {
            error = error.toString()
            console.error(error)
            if(error.includes("Failed to fetch"))
                alert("Problem with loading content, please check your connection.\n");
            else utilities.showMessage("Encountered an internal system error, unable to load questionnaire", "Problem Loading Questionnaire", "error")
            utilities.showErrorDiv()
        })

}

async function handleResponse(qName){
    let response = LForms.Util.getFormFHIRData("QuestionnaireResponse", "R4");
    let validationMsg;
    if(!response.item){
        validationMsg = "None of the questions were answered, please review the questionnaire again."
    }
    else {
        validationMsg = LForms.Util.checkValidity('formContainer')
        if(validationMsg){
            validationMsg = utilities.adjuctErrors(validationMsg)
        }
        else{
            if(qName === "followup"){
                validationMsg = utilities.answersValidation(response)
            }
        }
    }
    //if any string returned from the function, the response isn't valid, a message is presented and the patient needs to fix it
    if(validationMsg){
        utilities.showMessage(validationMsg, "Invalid Response")
    }
    else{
        try{
            utilities.handleLoadingSubmitButton()
            //first time of getting encounterID
            if(!encounterID) {
                encounterID = await utilities.getEncounterID(patientID, response, qDetails)
                if(!encounterID)
                    throw Error("Error creating encounter_id")
            }
            //adding compatible details to the respons
            response.subject = {"reference": "Patient/".concat(patientID)};
            response.extension = {
                "score": await utilities.getScore(response),
                "questionnaire_id": questions_id,
                "encounter_id": encounterID,
            }

            let responseStatusCode  = await utilities.postQuestionnaireResponse(response)
            if(responseStatusCode !== 200)
                throw Error("Error sending questionnaire response")
            console.log(response)
            //if the questionnaire is a followup (the first page of the encounter) check it's response to present the compatible next self-assessment questionnaire
            if(qName === "followup")
                displaySelfAssessment = utilities.checkResponseOfBaseline(response, qDetails, responsesUnderThresholdArray)
            if (displaySelfAssessment){
                qName = displaySelfAssessment.splice(0, 1)[0]
                let lastQuestionnaire = !displaySelfAssessment.length
                if(qName){
                    document.getElementById("submitButton").remove();
                    presentQuestionnaire(qName, lastQuestionnaire)
                }
                else {
                    isFormCompleted = true
                    window.location.replace("approval.html");
                }
            }
        }
        catch (error){
            utilities.handleUnLoadingSubmitButton()
            error = error.toString()
            console.error(error)
            if(error.includes("Failed to fetch"))
                alert("Problem with loading content, please check your connection.\n");
            else utilities.showMessage("Encountered an internal server error, response wasn't sent", "Error while Submitting Response", "error")
        }
    }
}

//convert all the previous encounter's responses questionnaire ID's to type (string)
//so we can get the score threshold
function responsesToIDs(responses){
    let indexToQType = {}
    for(let i =0; i < responses.length; i++){
        let qID = responses[i].extension.questionnaire_id
        for(let j = 0; j < Object.keys(qDetails).length; j++){
            let type = Object.keys(qDetails)[j]
            if(qID === qDetails[type]["qID"]){
                if(type === "baseline")
                    type = "followup"
                indexToQType[i] = type
            }
        }
    }
    return indexToQType
}

//check the previous encounter's response questions scores compared to the thresholds
//if the score is under the threshold, the compatible questionnaire will be displayed next
function responsesUnderThreshold(allResponses, qDetails){
    let indexToQType = responsesToIDs(allResponses)
    let responsesUnderThresholdArray = []
    for(let i = 0; i < allResponses.length; i++){
        let score = allResponses[i].extension.score
        if(score){
            if(score >=  qDetails[indexToQType[i]].threshold){
                responsesUnderThresholdArray.push(indexToQType[i])
            }
        }

    }
    return responsesUnderThresholdArray
}



