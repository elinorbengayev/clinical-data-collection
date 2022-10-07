
import * as utilities from "../src/utilities.js";
let patientID = window.location.search.substring(1).split("&")[0].split("=")[1];
let questions_id = null
let encounterID = null
let PATIENTID = "578a5228a0aa5d5d70b91606"
let qDetails = await fetch("./resources/conditionToQID.json")
qDetails = await qDetails.json()
let displaySelfAssessment = []
let isFormCompleted = false
presentQuestionnaire("baseline")

async function handleResponse(qName){
    let response = LForms.Util.getFormFHIRData("QuestionnaireResponse", "R4");
    let validationMsg;
    if(!response.item) {
        validationMsg = "None of the questions were answered, please review the questionnaire again."
    }
    else {
        validationMsg = LForms.Util.checkValidity('formContainer')
        if(validationMsg)
            validationMsg = utilities.adjuctErrors(validationMsg)
        else {
            if(qName === "baseline")
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
        try {
            utilities.handleLoadingSubmitButton()
            if(!encounterID) //first time of getting encounterID
                encounterID = await utilities.getEncounterID(PATIENTID, response, qDetails).catch(response => console.log(response))
            response.subject = {"reference": "Patient/".concat(PATIENTID)};
            console.log(response.subject, encounterID)
            response.extension = {
                "score": await utilities.getScore(response),
                "questionnaire_id": questions_id,
                "encounter_id": encounterID,
            }
            // downloadResponseAsFile(response, "response_testing_followup")
            console.log(response);
            document.getElementById("submitButton").remove();
            if(qName === "baseline")
                displaySelfAssessment = utilities.checkResponseOfBaseline(response, qDetails)
            if (displaySelfAssessment){
                qName = displaySelfAssessment.splice(0, 1)[0]
                let lastQuestionnaire = !displaySelfAssessment.length
                if(qName){
                    presentQuestionnaire(qName, lastQuestionnaire)
                }
                else {
                    isFormCompleted = true
                    window.location.replace("approval.html");
                } //Need to do only if approval was sent from the post
            }
            // hideSubmitButton()
            // postQuestionnaireResponse(response)
        }
        catch (e){
        }

    }
}

async function presentQuestionnaire(qName, lastQuestionnaire) {
    try {
        let questionnaire = {}
        let qID = qDetails[qName].qID
        await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='"+qID+"'")
            .then(response => response.json())
            .then(async fhirQ => {
                questionnaire = fhirQ[0]
                questions_id = questionnaire.id
                window.scrollTo(0, 0);
                window.addEventListener('beforeunload', (event) => {
                    if(!isFormCompleted)
                        event.returnValue = 'There is unsaved response. Are you sure you want to leave?';
                });
                if(qName === "baseline")
                    utilities.removeSpinnerDiv()
                LForms.Util.addFormToPage(questionnaire, 'formContainer');
                setTimeout(function() { utilities.createButton(qName, lastQuestionnaire, handleResponse); }, 1000);
            })
            .catch((error) => {
                console.log(error)
            });

    } catch (e) {
        console.log(e)
    }

}
function downloadResponseAsFile(response, fileName){
    const a = document.createElement("a");
    const file = new Blob([JSON.stringify(response,null,4)], {type : 'application/json'});
    a.href = URL.createObjectURL(file);
    a.download = fileName+'.json';
    a.click();
}


function postQuestionnaire(questionnaire){
    try {
        let statusCode
        const result = fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire', {
            method: 'POST',
            body: JSON.stringify(questionnaire),
            headers: {'Content-Type': 'application/json'}
        }).then(response => response.json())
            .then(async fhirQ => {
                if(statusCode === 200)
                    downloadResponseAsFile(fhirQ, "baselineBucket")
            })
            .catch((error) => {
                console.log(error)
            });

        // window.location.replace("approval.html"); //Need to do only if approval was sent from the post
    } catch (e) {
        console.log(e)
    }
}

function postQuestionnaireResponse(response){
    try {
        fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse', {
            method: 'POST',
            body: JSON.stringify(response),
            headers: {'Content-Type': 'application/json'}
        }).then(result => console.log(result))
            .catch((error) => {
                console.log(error)
            });

        // window.location.replace("approval.html"); //Need to do only if approval was sent from the post
    } catch (e) {
        console.log(e)
    }
}


export {presentQuestionnaire, displaySelfAssessment}

