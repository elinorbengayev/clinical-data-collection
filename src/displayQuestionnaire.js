
import * as utilities from "../src/utilities.js";

const patientID = window.location.search.substring(1).split("=")[1];
let questions_id = null
let encounterID = null
let qDetails = await fetch("./resources/conditionToQID.json")
qDetails = await qDetails.json()
let displaySelfAssessment = []
presentQuestionnaire("baseline")



//////////////////////////////////////
// document.body.addEventListener("mousemove", isResponseChanged)
let initalResponse = null
let current_qID = qDetails.baseline.qID
function getCurrentResponseWithoutDate(){
    let response = LForms.Util.getFormFHIRData("QuestionnaireResponse", "R4");
    delete response.authored;
    return response
}
function isResponseChanged(){
    let currentResponse
    if(initalResponse === null) {
        initalResponse = getCurrentResponseWithoutDate()
        return false
    }
    currentResponse = getCurrentResponseWithoutDate()
    let is_equal = deepEqual(initalResponse, currentResponse)
    if(is_equal === true){
        return false
    }
    else {
        unhideButton()
        return true
    }
}
let inital = {
    "resourceType": "QuestionnaireResponse",
    "meta": {
        "profile": [
            "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse|2.7"
        ],
        "tag": [
            {
                "code": "lformsVersion: 30.0.0"
            }
        ]
    },
    "status": "completed",
    "authored": "2022-09-11T16:04:48.764Z"
}
let one_ans = {
    "resourceType": "QuestionnaireResponse",
    "meta": {
        "profile": [
            "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse|2.7"
        ],
        "tag": [
            {
                "code": "lformsVersion: 30.0.0"
            }
        ]
    },
    "status": "completed",
    "authored": "2022-09-11T16:05:24.885Z",
    "item": [
        {
            "linkId": "/X789",
            "text": "Active Symptom(s)",
            "item": [
                {
                    "linkId": "/44250-9",
                    "text": "Have you been frequently experiencing any of the symptoms listed below in the past month? (Please select all that apply, multiple responses are possible)?",
                    "answer": [
                        {
                            "valueCoding": {
                                "code": "LA6571-8",
                                "display": "Lethargy"
                            }
                        }
                    ]
                }
            ]
        }
    ]
}
function deepEqual(x, y) {
    // if (x && y && typeof x === 'object' && typeof y === 'object'){
    //     if(Object.keys(x).length === Object.keys(y).length){
    //         console.log("same length")
    //         Object.keys(x).reduce(function(isEqual, key) {
    //             return isEqual && deepEqual(x[key], y[key]);
    //         }, true)
    //     }
    // }
    return (x && y && typeof x === 'object' && typeof y === 'object') ?
        (Object.keys(x).length === Object.keys(y).length) &&
        Object.keys(x).reduce(function (isEqual, key) {
            return isEqual && deepEqual(x[key], y[key]);
        }, true) : (x === y);
}
function unhideButton(){
    let btn = document.getElementById("submitButton");
    btn.disabled = false;
}
///////////////////////////////////////




function hideSubmitButton(){
    let btn = document.getElementById("submitButton");
    btn.setAttribute("hidden", "hidden");
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
            if(qName === "baseline")
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

async function presentQuestionnaire(qName, lastQuestionnaire) {
    try {
        let qID = qDetails[qName].qID
        await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='"+qID+"'")
            .then(response => response.json())
            .then(async fhirQ => {
                fhirQ = fhirQ[0]
                questions_id = fhirQ.id
                window.scrollTo(0, 0);
                // window.addEventListener('beforeunload', (event) => {
                //     event.returnValue = 'There is unsaved response. Are you sure you want to leave?';
                // });
                LForms.Util.addFormToPage(fhirQ, 'formContainer');
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

function flatItem(item, dic, questions){
    if(!item["item"]){
        if(Array.isArray(item)){
            // console.log(item)
            for(let i = 0; i < item.length; i++){
                if(questions && item[i].required || !questions){
                    dic[item[i].linkId] = item[i].text;
                }
            }
            return dic;
        }
        else{
            if(questions && item.required || !questions)
                dic[item.linkId] = item.text;
            // console.log(dic)
            return dic
        }
    }
    else
        return flatItem(item["item"], dic);
}

function extractDictOfItems(object, questions = true){
    let items = object["item"];
    let dic = {};
    for(let i = 0; i < items.length; i++){
        dic = flatItem(items[i], dic, questions);
    }
    return dic;
}

function validationCheck(questions, response){
    let missingQuestions = ""
    if(!response.item){
        missingQuestions = "None of the questions were answered, please review the questionnaire again."
    }
    else{
        missingQuestions = "Please answer the following question(s) before continuing:\n"
        let questionsDic = extractDictOfItems(questions)
        console.log(questionsDic)
        let answersDic = extractDictOfItems(response, false)
        for(const question in questionsDic){
            if(!answersDic.hasOwnProperty(question)){
                missingQuestions = missingQuestions.concat(questionsDic[question]+"\n");
            }
        }
        console.log(missingQuestions);
    }
    return missingQuestions;
}

function postQuestionnaire(questionnaire){
    try {
        console.log("posting...")
        console.log(questionnaire)
        let statusCode
        const result = fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire', {
            method: 'POST',
            body: JSON.stringify(questionnaire),
            headers: {'Content-Type': 'application/json'}
        }).then(response => response.json())
            .then(async fhirQ => {
                console.log(fhirQ)
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

