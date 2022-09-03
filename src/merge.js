




// console.log(fhirQ)

// console.log(qr)
// var fhirQ = {
//     "resourceType": "Questionnaire",
//     "meta": {
//         "profile": [
//             "http://hl7.org/fhir/us/sdc/StructureDefinition/sdc-questionnaire|2.7"
//         ]
//     },
//     "title": "Patient Information",
//     "name": "Patient Information",
//     "identifier": [
//         {
//             "value": "patientInfo"
//         }
//     ],
//     "item": [
//         {
//             "type": "string",
//             "required": false,
//             "linkId": "/name",
//             "text": "Name"
//         }
//     ]
// };
//
// // Sample QuestionnaireResponse
// var qr = {
//     "resourceType": "QuestionnaireResponse",
//     "meta": {
//         "profile": [
//             "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse|2.7"
//         ]
//     },
//     "status": "completed",
//     "authored": "2019-12-19T19:47:54.655Z",
//     "item": [
//         {
//             "linkId": "/name",
//             "text": "Name",
//             "answer": [
//                 {
//                     "valueString": "Abe"
//                 }
//             ]
//         }
//     ]
// };

// Convert FHIR Questionnaire to LForms format
// // Merge QuestoinnaireResponse
let fhirQ = await fetch("./resources/followUp/followupUpdate.json");
fhirQ = await fhirQ.json();
// fhirQ.item[0].linkId = fhirQ.item[0].extension[0].baselineLinkId;
// fhirQ = await fetch("https://czp2w6uy37.execute-api.us-east-1.amazonaws.com/test/linkid_convertor")
// console.log(fhirQ)
// let fhirQ = await fetch("./resources/followUp/followupUpdate.json");
// fhirQ = await fhirQ.json();

/////Working fetching code/////////////
const response = fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/linkid_convertor', {
    method: 'POST',
    body: JSON.stringify(fhirQ),
    headers: {'Content-Type': 'application/json'}
}).then(response => response.json())
    .then(async fhirQ => {
        console.log(fhirQ)
        var lformsQ = LForms.Util.convertFHIRQuestionnaireToLForms(fhirQ, 'R4');
        let qr = await fetch("./resources/followUp/response_base.json");
        qr = await qr.json();
        var formWithUserData = LForms.Util.mergeFHIRDataIntoLForms("QuestionnaireResponse", qr, lformsQ, "R4");
        LForms.Util.addFormToPage(formWithUserData, 'formContainer');
        // LForms.Util.addFormToPage(lformsQ, 'formContainer');
        setTimeout(function() { createButton(); }, 1000);
    })


// LForms.Util.addFormToPage(questions, 'formContainer')


// console.log(fhirQ)
// var lformsQ = LForms.Util.convertFHIRQuestionnaireToLForms(fhirQ, 'R4');
// //
// let qr = await fetch("./resources/followUp/baseline_one_at_a_time.json");
// qr = await qr.json();
// //
// var formWithUserData = LForms.Util.mergeFHIRDataIntoLForms("QuestionnaireResponse", qr, lformsQ, "R4");
// // // Add the form to the page
// LForms.Util.addFormToPage(formWithUserData, 'formContainer');
// setTimeout(function() { createButton(); }, 1000);

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

// // Add the form to the page
// LForms.Util.addFormToPage(formWithUserData, 'formContainer');