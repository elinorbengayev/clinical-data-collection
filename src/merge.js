import * as utilities from "../src/utilities.js";

let qDetails = await fetch("./resources/conditionToQID.json")
qDetails = await qDetails.json()
let questions_id = null
let encounterID = null;
let displaySelfAssessment = []

var patientID = window.location.search.substring(1).split("=")[1].split("&")[0];
var lastEncounterID = window.location.search.substring(1).split("=")[2];
let allResponses = await utilities.getQuestionnaireResponse("encounter_id", lastEncounterID)
let indexToQType = responsesToIDs(allResponses)
presentQuestionnaire("followup")

/////Working fetching code/////////////
async function presentQuestionnaire(qName, lastQuestionnaire){
    let qID = qDetails[qName].qID
    let fhirQ = null
    await fetch(
        "https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='".concat(qID,"'"))
        .then(response => response.json())
        .then(async result => {
            fhirQ = result[0]
            questions_id = result.id
    })
    if(qName === "followup"){
        await fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/linkid_convertor', {
            method: 'POST',
            body: JSON.stringify(fhirQ),
            headers: {'Content-Type': 'application/json'}
        }).then(response => response.json())
            .then(async result => {
                fhirQ = LForms.Util.convertFHIRQuestionnaireToLForms(result, 'R4');
                let qr = allResponses[0];
                qr.item.splice(0, 1)
                fhirQ = LForms.Util.mergeFHIRDataIntoLForms("QuestionnaireResponse", qr, fhirQ, "R4");
                LForms.Util.addFormToPage(fhirQ, 'formContainer');
                setTimeout(function() { utilities.createButton(qName, lastQuestionnaire, handleResponse); }, 1000);
            })
            .catch((error) => {
                console.log(error)
            });
    }
    else{
        fhirQ = LForms.Util.convertFHIRQuestionnaireToLForms(fhirQ, 'R4');
        LForms.Util.addFormToPage(fhirQ, 'formContainer');
        setTimeout(function() { utilities.createButton(qName, lastQuestionnaire, handleResponse); }, 1000);
    }
}

async function handleResponse(qName){
    let response = LForms.Util.getFormFHIRData("QuestionnaireResponse", "R4");
    // console.log(response);
    // let missingQuestions = validationCheck(questions, response);
    let missingQuestions = [];
    if(missingQuestions.length !==0 ) {
        swal({
            title: "Missing answers",
            text: missingQuestions,
            icon: "warning",
            button: "Got it",
        })
    }
    else {
        try{
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
            document.getElementById("submitButton").remove();
            if(qName === "followup")
                displaySelfAssessment = utilities.checkResponseOfBaseline(response, qDetails)
            if (displaySelfAssessment){
                qName = displaySelfAssessment.splice(0, 1)[0]
                let lastQuestionnaire = !displaySelfAssessment.length
                if(qName)
                    presentQuestionnaire(qName, lastQuestionnaire)
                //else window.location.replace("approval.html"); //Need to do only if approval was sent from the post
            }
            // hideSubmitButton()
            // postQuestionnaireResponse(response)
        }
        catch (e){
            console.log(e, "rrrrr")
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
                indexToQType[type] = i
            }
        }
    }
    return indexToQType
}



