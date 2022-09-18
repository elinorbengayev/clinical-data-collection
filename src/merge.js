import {getQuestionnaireResponse} from "../src/utilities.js";

let qDetails = await fetch("./resources/conditionToQID.json")
qDetails = await qDetails.json()
let qID = qDetails.followUp.qID
let fhirQ = await fetch(
    "https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='".concat(qID,"'"))
fhirQ = await fhirQ.json();
fhirQ = fhirQ[0]
var encounterID = window.location.search.substring(1).split("=")[1];

console.log(encounterID)
console.log(fhirQ)
displayFollowup()
let allResponses = await getQuestionnaireResponse("encounter_id", encounterID)
console.log(allResponses)

/////Working fetching code/////////////
async function displayFollowup(){
    const response = fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/linkid_convertor', {
        method: 'POST',
        body: JSON.stringify(fhirQ),
        headers: {'Content-Type': 'application/json'}
    }).then(response => response.json())
        .then(async fhirQ => {
            console.log(fhirQ)
            var lformsQ = LForms.Util.convertFHIRQuestionnaireToLForms(fhirQ, 'R4');
            let qr = await fetch("./resources/response_baseline_bucket.json");
            qr = await qr.json();
            qr.item.splice(0, 1)
            console.log(qr)
            var formWithUserData = LForms.Util.mergeFHIRDataIntoLForms("QuestionnaireResponse", qr, lformsQ, "R4");
            console.log(formWithUserData)
            LForms.Util.addFormToPage(formWithUserData, 'formContainer');
            setTimeout(function() { createButton(); }, 1000);
        })
        .catch((error) => {
            console.log(error)
        });
}

function createButton(){
    let div = document.getElementById("submitButton");
    const btn = document.createElement("button");
    btn.setAttribute("class", "btn btn-primary mt-1");
    btn.innerHTML += "Submit";
    btn.addEventListener("click", handleResponse);
    div.appendChild(btn);

}

async function handleResponse(){
    let response = LForms.Util.getFormFHIRData("QuestionnaireResponse", "R4");
    // let missing_questions = validation_check(questions, response);
    response.subject = {"reference": "Patient/patient_id"};
    response.extension = {
        "score": null,
        "questionnaire_id": fhirQ.id,
        "encounter_date": "07/07/22",
        "is_follow_up": true
    }
        // const a = document.createElement("a");
        // const file = new Blob([JSON.stringify(response,null,4)], {type : 'application/json'});
        // a.href = URL.createObjectURL(file);
        // a.download = 'response.json';
        // a.click();
        console.log(response);

        // window.location.replace("approval.html"); //Need to do only if approval was sent from the post
        // try {
        //     const result = fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse', {
        //         method: 'POST',
        //         body: JSON.stringify(response),
        //         headers: {'Content-Type': 'application/json'}
        //     }).then(response => response.json)
        //         .then(json => console.log(json));
        // }
        // catch (e){
        //         console.log(e)
        // }
}



