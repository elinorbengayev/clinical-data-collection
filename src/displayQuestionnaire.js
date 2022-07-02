

let res = null;
// fetch("./resources/PHQ9_SDC.json")
//     .then(response => response.json())
//     .then(json => LForms.Util.addFormToPage(json, 'formContainer'));

const response = await fetch('https://3hxhninubinga65uw3i5jkpssm0bbgxs.lambda-url.us-east-1.on.aws/');
// const response = await fetch('https://czp2w6uy37.execute-api.us-east-1.amazonaws.com/test/Questionnaire');
const json = await response.json();
LForms.Util.addFormToPage(json, 'formContainer')
console.log(json);

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

    const url = new URL("https://i4nyjmf3odmdjgeu6jnq6owfw40skwxf.lambda-url.us-east-1.on.aws/");
    url.search = new URLSearchParams(res);
    const response = await fetch(url);

    // const a = document.createElement("a");
    // const file = new Blob([JSON.stringify(res,null,4)], {type : 'application/json'});
    // a.href = URL.createObjectURL(file);
    // a.download = 'response.json';
    // a.click();
}

document.getElementById("Submit").addEventListener("click", handleResponse);

