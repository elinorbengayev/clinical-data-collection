import * as utilities from "../src/utilities.js";
import {medicationsValidation} from "../src/utilities.js";

let qDetails = await fetch("./resources/conditionToQID.json")
qDetails = await qDetails.json()
let questions_id = null
let encounterID = null;
let displaySelfAssessment = []
let patientID = window.location.search.substring(1).split("=")[2].split("&")[0];
console.log("patientID ", patientID)
let lastEncounterID = window.location.search.substring(1).split("=")[3];
let allResponses = await utilities.getQuestionnaireResponse("encounter_id", lastEncounterID)
let responsesUnderThresholdArray = responsesUnderThreshold(allResponses, qDetails)
let isFormCompleted = false
presentQuestionnaire("followup")

/////Working fetching code/////////////
async function presentQuestionnaire(qName, lastQuestionnaire){
    let qID = qDetails[qName].qID
    let questionnaire = {}

    window.addEventListener('beforeunload', (event) => {
        if(!isFormCompleted)
            event.returnValue = 'There is unsaved response. Are you sure you want to leave?';
    });

    await fetch(
        "https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='".concat(qID,"'"))
        .then(response => response.json())
        .then(async result => {
            questionnaire = result[0]
            questions_id = result.id
    })
    if(qName === "followup"){
        await fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/linkid_convertor', {
            method: 'POST',
            body: JSON.stringify(questionnaire),
            headers: {'Content-Type': 'application/json'}
        }).then(response => response.json())
            .then(async result => {
                questionnaire = LForms.Util.convertFHIRQuestionnaireToLForms(result, 'R4');
                let qr = allResponses[0];
                qr.item.splice(0, 1)
                questionnaire = LForms.Util.mergeFHIRDataIntoLForms("QuestionnaireResponse", qr, questionnaire, "R4");
                utilities.removeSpinnerDiv()
                LForms.Util.addFormToPage(questionnaire, 'formContainer');
                setTimeout(function() { utilities.createButton(qName, lastQuestionnaire, handleResponse); }, 1000);
            })
            .catch((error) => {
                console.log(error)
            });
    }
    else{
        questionnaire = LForms.Util.convertFHIRQuestionnaireToLForms(questionnaire, 'R4');
        window.scrollTo(0, 0);
        LForms.Util.addFormToPage(questionnaire, 'formContainer');
        setTimeout(function() { utilities.createButton(qName, lastQuestionnaire, handleResponse); }, 1000);
    }
}

async function handleResponse(qName){
    let response = LForms.Util.getFormFHIRData("QuestionnaireResponse", "R4");
    let validationMsg;
    if(!response.item){
        validationMsg = "None of the questions were answered, please review the questionnaire again."
    }
    else {
        validationMsg = LForms.Util.checkValidity('formContainer')
        console.log(qName, validationMsg)

        if(validationMsg){
            validationMsg = utilities.adjuctErrors(validationMsg)
        }
        else{
            if(qName === "followup")
                validationMsg = utilities.answersValidation(response)
        }
    }
    if(validationMsg) {
        swal({
            title: "Invalid Response",
            text: validationMsg,
            icon: "warning",
            button: "Got it",
        })
    }
    else {
        try{
            utilities.handleLoadingSubmitButton()
            if(!encounterID) //first time of getting encounterID
                encounterID = await utilities.getEncounterID(patientID, response, qDetails).catch(response => console.log(response))
            response.subject = {"reference": "Patient/".concat(patientID)};
            console.log(response.subject, encounterID)
            response.extension = {
                "score": await utilities.getScore(response),
                "questionnaire_id": questions_id,
                "encounter_id": encounterID,
            }
            // downloadResponseAsFile(response, "response_testing_followup")
            console.log(response);
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
                    window.location.replace("approval.html");  //Need to do only if approval was sent from the post
                }
            }
            // hideSubmitButton()
            // postQuestionnaireResponse(response)
        }
        catch (e){
            console.log(e)
        }
    }
}

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



