
// import fs from 'fs'

// let questions = await fetch("./resources/MMSE_bucket.json");
// questions = await questions.json()
// console.log(questions);
// LForms.Util.addFormToPage(questions, 'formContainer')
// extractNumOfItems(questions)
// const urlParams = new URLSearchParams(window.location.search);
// const q_id = urlParams.get('q_id');
// console.log(q_id);
let questions = null
try {
    //PHQ-9
    // questions = await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='786e8353-5b07-4947-98be-8e2928eb6d7d'")
    //MMSE
    // questions = await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='1f971dfa-cb6b-4cc2-9eaf-d4de58afe9a9'")

    questions = await fetch("./resources/baselineVisit.json");
    questions = await questions.json();
    // questions = questions[0]
    // write JSON string to a file

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
    if(missing_questions.length !==0 ) {
        swal({
            title: "Missing answers",
            text: missing_questions,
            icon: "error",
            button: 'Got it',
        })
    }
    else{
        response.subject = {"reference": "Patient/patient_id"};
        response.extension = {
            "score": null,
            "questionnaire_id": questions.id,
            "encounter_date" : "07/07/22"
        }
        // const a = document.createElement("a");
        // const file = new Blob([JSON.stringify(response,null,4)], {type : 'application/json'});
        // a.href = URL.createObjectURL(file);
        // a.download = 'response.json';
        // a.click();
        console.log(response);
        window.location.replace("approval.html"); //Need to do only if approval was sent from the post
        try {
            const result = fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse', {
                method: 'POST',
                body: JSON.stringify(response),
                headers: {'Content-Type': 'application/json'}
            }).then(response => response.json)
                .then(json => console.log(json));
        }
        catch (e){
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
        let questions_dic = extractNumOfItems(questions)
        let answers_dic = extractNumOfItems(response, false)
        let count = 1;
        for(const question in questions_dic){
            if(!answers_dic.hasOwnProperty(question)){
                missing_questions = missing_questions.concat(count, ") ", questions_dic[question]+"\n");
                count+=1
            }
        }
        console.log(missing_questions);
    }
    return missing_questions;
}


