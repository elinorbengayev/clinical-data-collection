let questions = null
try {
    questions = await fetch("./resources/followUp/followup_test.json");
    questions = await questions.json();
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
    response.subject = {"reference": "Patient/patient_id"};
    response.extension = {
        "score": null,
        "questionnaire_id": questions.id,
        "encounter_date" : "07/07/22",
        "is_follow_up": true
    }
    const a = document.createElement("a");
    const file = new Blob([JSON.stringify(response,null,4)], {type : 'application/json'});
    a.href = URL.createObjectURL(file);
    a.download = 'response.json';
    a.click();
    console.log(response);


    //////Triggers post function
    // try {
    //     const result = fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse', {
    //         method: 'POST',
    //         body: JSON.stringify(response),
    //         headers: {'Content-Type': 'application/json'}
    //     }).then(result => console.log("returned", result));
    //
    //     window.location.replace("approval.html"); //Need to do only if approval was sent from the post
    // }
    // catch (e){
    //         console.log(e)
    // }

}