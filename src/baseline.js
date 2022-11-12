import * as utilities from "../src/utilities.js";

let questions_id, encounterID = null
let displaySelfAssessment = []
let isFormCompleted = false

//Get the all questionnaire details - ID, score threshold, time threshold, etc
let qDetails = await fetch("./resources/conditionToQID.json")
qDetails = await qDetails.json()

const patientID = window.location.search.substring(1).split("=")[2].split("&")[0];

if(patientID)
    presentQuestionnaire("baseline")
else{
    console.error("Problem with given url's parameters")
    utilities.showMessage("Encountered an internal system error, unable to load questionnaire", "Problem Loading Questionnaire", "error")
    utilities.showErrorDiv()
}

async function presentQuestionnaire(qName, lastQuestionnaire){
    let questionnaire = {}
    let qID = qDetails[qName].qID
    await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='"+qID+"'")
        .then(response => utilities.checkFetch(response))
        .then(response => response.json())
        .then(async fhirQ => {
            //the questionnaire is returned inside an array with single element
            questionnaire = fhirQ[0]
            questions_id = questionnaire.id
            window.scrollTo(0, 0);

            //adding handler in case of pressing the browser's reload or back buttons
            window.addEventListener('beforeunload', (event) => {
                if(!isFormCompleted)
                    event.returnValue = 'There is unsaved response. Are you sure you want to leave?';
            });

            if(qName === "baseline")
                utilities.removeSpinnerDiv()
            LForms.Util.addFormToPage(questionnaire, 'formContainer');
            setTimeout(function() { utilities.createSubmitButton(qName, lastQuestionnaire, handleResponse); }, 1000);
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

//The handles the page at the event of pressing the submit button.
//It validated the response, sends it with post request and loads the next questionnaire
//according to the response if it's not the last one.
async function handleResponse(qName){
    let response = LForms.Util.getFormFHIRData("QuestionnaireResponse", "R4");
    let validationMsg;
    if(!response.item)
        validationMsg = "None of the questions were answered, please review the questionnaire again."
    else {
        validationMsg = LForms.Util.checkValidity('formContainer')
        if(validationMsg)
            validationMsg = utilities.adjuctErrors(validationMsg)
        else {
            if(qName === "baseline")
                validationMsg = utilities.answersValidation(response)
        }
    }

    //if any string returned from the function, the response isn't valid, a message is presented and the patient needs to fix it
    if(validationMsg)
        utilities.showMessage(validationMsg, "Invalid Response")
    else {
        try {
            utilities.handleLoadingSubmitButton()
            //first time of getting encounterID
            if(!encounterID) {
                encounterID = await utilities.getEncounterID(patientID, response, qDetails)
                if(!encounterID)
                    throw Error("Error creating encounter_id")
            }

            //adding compatible details to the response
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

            //if the questionnaire is a baseline (the first page of the encounter) check it's response to present the compatible next self-assessment questionnaire
            if(qName === "baseline")
                displaySelfAssessment = utilities.checkResponseOfBaseline(response, qDetails)
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


export {presentQuestionnaire, displaySelfAssessment}

