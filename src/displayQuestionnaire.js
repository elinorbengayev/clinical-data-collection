

let res = null;
// fetch("./resources/PHQ9_SDC.json")
//     .then(response => response.json())
//     .then(json => LForms.Util.addFormToPage(json, 'formContainer'));
try {
    const get_res = await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_name='PHQ-9 quick depression assessment panel'")

    const json = await get_res.json();
    console.log(json[0]);
    LForms.Util.addFormToPage(json[0], 'formContainer')
}
catch (e){
    console.log(e)
}

async function handleResponse(){
    res = LForms.Util.getFormFHIRData("QuestionnaireResponse", "R4");
    res.subject = {"reference": "Patient/patient_id"};
    res.extension ={
        "score": null,
        "questionnaire_id": "786e8353-5b07-4947-98be-8e2928eb6d7d",
        "encounter_date" : "05/07/22"
    }
    console.log(res);
    try {
        const result = fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse', {
            method: 'POST',
            body: JSON.stringify(res),
            headers: {'Content-Type': 'application/json'}
        }).then(res => res.json)
            .then(json => console.log(json));
    }
    catch (e){
            console.log(e)
    }
    // textFileAsBlob = new Blob([JSON.stringify(res,null,4)], {type : 'application/json'});
    // const a = document.createElement("a");
    // const file = new Blob([JSON.stringify(res,null,4)], {type : 'application/json'});
    // a.href = URL.createObjectURL(file);
    // a.download = 'response.json';
    // a.click();
}

document.getElementById("Submit").addEventListener("click", handleResponse);

