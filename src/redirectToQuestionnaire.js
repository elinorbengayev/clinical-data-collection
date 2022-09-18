

import {getQuestionnaireResponse} from "../src/utilities.js";

async function redirect(){
    let pID = document.getElementById("inputPatientID").value;
    //TO DO: Add pID validation
    let responses = await getQuestionnaireResponse("patient_id", pID)
    if(responses.length === 0){
        window.location.href = "index.html"; //Need to do only if approval was sent from the post
    }
    else {
        let encounterID = responses[0].extension.encounter_id;
        window.location.href = "merge.html?encounter_id=" + encounterID;
    }

}

document.getElementById("submitDetails").addEventListener("click", redirect);

