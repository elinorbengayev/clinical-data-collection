
// import fs from 'fs'
// let questions_id;
// let questions = await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='33805677-47df-4a77-bd01-f6f01bd82ab0'")
//     .then(response => response.json())
//     .then(async q => {
//         questions_id = q[0].id
//         console.log(q)
//         // var lformsQ = LForms.Util.convertFHIRQuestionnaireToLForms(q, 'R4');
//         LForms.Util.addFormToPage(q[0], 'formContainer')
//         setTimeout(function() { createButton(); }, 1000);
//     })
let questions = null
try {
    //PHQ-9
    // questions = await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='786e8353-5b07-4947-98be-8e2928eb6d7d'")
    //MMSE
    // questions = await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='1f971dfa-cb6b-4cc2-9eaf-d4de58afe9a9'")

    // questions = await fetch("./resources/followupVisit.json");
    // questions = await fetch("./resources/PHQ-9.json");
    questions = await fetch("./resources/baselineVisit.json");
    // questions = await fetch("./resources/simple_test.json");
    // questions = await fetch("./resources/ParstA.json");
    // questions = await fetch("./resources/followUp/followupUpdate.json");
    console.log(questions)
    questions = await questions.json();
    // questions = questions[0]
    LForms.Util.addFormToPage(questions, 'formContainer')

    setTimeout(function() { createButton(); }, 1000);
}
catch (e){
    console.log(e)
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
    let missing_questions = validation_check(questions, response);
    // let missing_questions = [];
    if(missing_questions.length !==0 ) {
        swal({
            title: "Missing answers",
            text: missing_questions,
            icon: "warning",
            button: 'Got it',
        })
    }
    else {
        response.subject = {"reference": "Patient/5d25c96f3cae1051b7dfef23"};
        response.extension = {
            "score": null,
            "questionnaire_id": questions_id,
            "encounter_date": "07/09/22",
            "encounter_id": "73d0da36-e27f-4dec-b443-a948bd404a28",
            "visit_id": null
        }
        // "is_follow_up": true
        // const a = document.createElement("a");
        // const file = new Blob([JSON.stringify(response,null,4)], {type : 'application/json'});
        // a.href = URL.createObjectURL(file);
        // a.download = 'response.json';
        // a.click();
        // let response = await fetch("./converting_response/done_response.json")
        //                 .then(result => result.json())
        //                 .then(async body => {
        //                     console.log(body)
        //                     fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse', {
        //                         method: 'POST',
        //                         body: JSON.stringify(body),
        //                         headers: {'Content-Type': 'application/json'}
        //                         })
        //                         .then(result => result.json())
        //                         .then(async body => {
        //                             console.log(body)
        //                         })
        //                         .catch((error) => {
        //                             console.log(error)
        //                         });
        //                 })
        // console.log(response);
        try {
            const result = fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse', {
                method: 'POST',
                body: JSON.stringify(response),
                headers: {'Content-Type': 'application/json'}
            }).then(result => console.log(result))
                // .then(async body => {
                //     console.log(body)
                // })
                .catch((error) => {
                    console.log(error)
                });

            // window.location.replace("approval.html"); //Need to do only if approval was sent from the post
        } catch (e) {
            console.log(e)
        }
    }
}


function flatItem(item, dic, questions){
    if(!item["item"]){
        if(Array.isArray(item)){
            for(let i = 0; i < item.length; i++){
                if(questions && item[i].required || !questions)
                    dic[item[i].linkId] = item[i].text;
            }
            return dic;
        }
        else{
            if(questions && item.required || !questions)
                dic[item.linkId] = item.text;
            return dic
        }
    }
    else
        return flatItem(item["item"], dic);
}
function extractNumOfItems(object, questions = true){
    let items = object["item"];
    let dic = {};
    for(let i = 0; i < items.length; i++){
        dic = flatItem(items[i], dic, questions);
    }
    return dic;
}
function validation_check(questions, response){
    let missing_questions = ""
    if(!response.item){
        missing_questions = "None of the questions were answered, please review the questionnaire again."
    }
    else{
        missing_questions = "Please answer the following question(s) before continuing:\n"
        let questions_dic = extractNumOfItems(questions)
        let answers_dic = extractNumOfItems(response, false)
        for(const question in questions_dic){
            if(!answers_dic.hasOwnProperty(question)){
                missing_questions = missing_questions.concat(questions_dic[question]+"\n");
            }
        }
        console.log(missing_questions);
    }
    return missing_questions;
}


