

let questions = null
let questions_id = null

// document.body.addEventListener("mousemove", isResponseChanged)
let initalResponse = null
let qDetails = await fetch("./resources/conditionToQID.json")
qDetails = await qDetails.json()
let current_qID = qDetails.baseline.qID
let displaySelfAssessment = []
// try {
//     console.log("here")
//     questions = await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='"+current_qID+"'")
//         .then(response => response.json())
//         .then(async fhirQ => {
//             fhirQ = fhirQ[0]
//             questions_id = fhirQ.id
//             LForms.Util.addFormToPage(fhirQ, 'formContainer');
//             setTimeout(function() { createButton(); }, 1000);
//         })
//         .catch((error) => {
//             console.log(error)
//         });
// }
// catch (e){
//     console.log(e)
// }
presentQuestionnaire("baseline")
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
// console.log(deepEqual(inital, inital))
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
        Object.keys(x).reduce(function(isEqual, key) {
            return isEqual && deepEqual(x[key], y[key]);
        }, true) : (x === y);
}

function unhideButton(){
    let btn = document.getElementById("submitButton");
    btn.disabled = false;
}

function createButton(qName, lastQuestionnaire){
    lastQuestionnaire ? console.log(getEventListeners(window)) : null
    let div = document.getElementById("submitDiv");
    let btn = document.createElement("button");
    btn.innerHTML = !lastQuestionnaire ? "Submit and continue to the next form" : "Submit and finish"
    btn.className = "btn btn-primary"
    btn.id = "submitButton"
    btn.addEventListener("click", function(){
        handleResponse(qName)
    });
    div.appendChild(btn)
    // let btn = document.getElementById("submitButton");
    // btn.removeAttribute("hidden");

    // btn.disabled = true;
}


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
        response.subject = {"reference": "Patient/patient_id"};
        response.extension = {
            "score": await getScore(response),
            "questionnaire_id": questions_id,
            "encounter_id": "73d0da36-e27f-4dec-b443-a948bd404a28",
            // "is_follow_up": true
        }
        // downloadResponseAsFile(response, "response_baseline_bucket")
        
        console.log(response);
        document.getElementById("submitButton").remove();
        if(qName === "baseline")
            displaySelfAssessment = checkResponseOfBaseline(response)
        if (displaySelfAssessment){
            qName = displaySelfAssessment.splice(0, 1)[0]
            let lastQuestionnaire = !displaySelfAssessment.length
            qName ? presentQuestionnaire(qName, lastQuestionnaire) :
                window.location.replace("approval.html"); //Need to do only if approval was sent from the post
        }
        // hideSubmitButton()
        // postQuestionnaireResponse(response)
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
                window.addEventListener('beforeunload', (event) => {
                    event.returnValue = 'There is unsaved response. Are you sure you want to leave?';
                });
                LForms.Util.addFormToPage(fhirQ, 'formContainer');
                setTimeout(function() { createButton(qName, lastQuestionnaire); }, 1000);
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

function ifAnswerInSelfAssessment(answerCode){
    let conditions = Object.keys(qDetails)
    conditions.splice(0,2)
    for(let i = 0; i < conditions.length; i++){
        let curr_code = qDetails[conditions[i]].aID
        if(curr_code === answerCode){
            return conditions[i]
        }
    }
    return null
}

function checkResponseOfBaseline(response){
    let answersPartA = response.item[1].item[0].answer
    let displaySelfAssessment = []
    if(answersPartA){
        for (let i = 0; i < answersPartA.length; i++){
            let answer = answersPartA[i].valueCoding.code
            let condition = ifAnswerInSelfAssessment(answer)
            if(condition)
                displaySelfAssessment.push(condition)
        }
    }
    if(!displaySelfAssessment.includes("PHQ-9"))
        displaySelfAssessment.push("PHQ-9")
    return displaySelfAssessment
}

async function getScore(response) {
    let scoreIDs = await fetch("./resources/scoresIDS.json")
    scoreIDs = await scoreIDs.json()
    scoreIDs = scoreIDs.scoreIDs
    let lastQuestion = response.item[response.item.length - 1]
    let score;
    let linkID = lastQuestion.linkId
    if(scoreIDs.includes(linkID)){
        score = lastQuestion.answer[0].valueDecimal
        return Number.isInteger(score) ? score : null
    }
    return null
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





