let questions = null
try {
    // questions = await fetch("./resources/followUp/followup_test.json");
    let qID = "33805677-47df-4a77-bd01-f6f01bd82ab0"
    questions = await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_id='"+qID+"'")
    questions = await questions.json();
    questions = questions[0]

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
    response.subject = {"reference": "Patient/594d3e7029488f18cacad39b"};
    response.extension = {
        "score": null,
        "questionnaire_id": questions.id,
        "encounter_id": "c248e968-a6e5-4c37-91f4-729d40c85500"
    }
    const a = document.createElement("a");
    const file = new Blob([JSON.stringify(response,null,4)], {type : 'application/json'});
    a.href = URL.createObjectURL(file);
    a.download = 'response.json';
    a.click();
    console.log(response);


    //////Triggers post function
    try {
        const result = fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse', {
            method: 'POST',
            body: JSON.stringify(response),
            headers: {'Content-Type': 'application/json'}
        }).then(result => console.log("returned", result));

        // window.location.replace("approval.html"); //Need to do only if approval was sent from the post
    }
    catch (e){
            console.log(e)
    }

}