
import * as utilities from "../src/utilities.js";

async function redirect(){
    utilities.handleLoadingSubmitButton();
    let pID = document.getElementById("inputPatientID").value;
    //TO DO: Add pID validation
    let questionnairesIDs = await getAllQuestionnaireIDs()
    let responses = await utilities.getQuestionnaireResponse("patient_id", pID)
    let lastResponse = responses[responses.length - 1]
    if(!questionnairesIDs.includes(lastResponse.extension.questionnaire_id) || responses.length === 0){
        window.location.href = "index.html".concat("?type=baseline&patient_id=", pID); //Need to do only if approval was sent from the post
    }
    else {
        let encounterID = responses[responses.length - 1].extension.encounter_id;
        window.location.href = "index.html".concat("?type=followup&patient_id=", pID, "&encounter_id=", encounterID); //Need to do only if approval was sent from the post
    }
}

async function getAllQuestionnaireIDs() {
    let qDetails = await fetch("./resources/conditionToQID.json")
    qDetails = await qDetails.json()
    let questionnairesIDs = []
    for(let i = 0; i < Object.keys(qDetails).length; i++){
        if(qDetails[Object.keys(qDetails)[i]].qID)
            questionnairesIDs.push(qDetails[Object.keys(qDetails)[i]].qID)
    }
    return questionnairesIDs
}

document.getElementById("submitButton").addEventListener("click", redirect);

