

let res = null;
// fetch("./resources/PHQ9_SDC.json")
//     .then(response => response.json())
//     .then(json => LForms.Util.addFormToPage(json, 'formContainer'));
try {
    let questionnaire_name = 'PHQ-9 quick depression assessment panel';
    const response = await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/Questionnaire?questionnaire_name='PHQ-9 quick depression assessment panel'")
    //     method: 'GET',
    //     // body: JSON.stringify(res),
    //     headers: {
    //         "Access-Control-Allow-Headers" : "Content-Type",
    //         "Access-Control-Allow-Origin": 'http://localhost:63342',
    //         "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
    //     }
    // });
    // const response = await fetch('https://3hxhninubinga65uw3i5jkpssm0bbgxs.lambda-url.us-east-1.on.aws/');
    // const response = await fetch('https://czp2w6uy37.execute-api.us-east-1.amazonaws.com/test/Questionnaire');
    const json = await response.json();
    console.log(json[0]);
    LForms.Util.addFormToPage(json[0], 'formContainer')
}
catch (e){
    console.log(e)
}

async function handleResponse(){
    res = LForms.Util.getFormFHIRData("QuestionnaireResponse", "R4");
    res.subject = {"reference": "Patient/some_patient_id"};
    res.extension ={
        "score": null,
        "questionnaire_id": "d92e6f03-958c-455f-b732-f4abcfebbc43",
        "encounter_date" : "01/07/22"
    }
    console.log(res);
    // textFileAsBlob = new Blob([JSON.stringify(res,null,4)], {type : 'application/json'});

    // const result = fetch('https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse', {
    //     method: 'POST',
    //     body: JSON.stringify(res),
    //     headers: { 'Content-Type': 'application/json' }
    // }).then(res => res.json())
    //     .then(json => console.log(json));

    // const a = document.createElement("a");
    // const file = new Blob([JSON.stringify(res,null,4)], {type : 'application/json'});
    // a.href = URL.createObjectURL(file);
    // a.download = 'response.json';
    // a.click();
}

document.getElementById("Submit").addEventListener("click", handleResponse);

