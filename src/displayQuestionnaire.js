

let res = null;
fetch("./resources/PHQ9_SDC.json")
    .then(response => response.json())
    .then(json => LForms.Util.addFormToPage(json, 'formContainer'));

function handleResponse(){
    res = LForms.Util.getFormFHIRData("QuestionnaireResponse", "R4", );
    console.log(res);
    // textFileAsBlob = new Blob([JSON.stringify(res,null,4)], {type : 'application/json'});

    const a = document.createElement("a");
    const file = new Blob([JSON.stringify(res,null,4)], {type : 'application/json'});
    a.href = URL.createObjectURL(file);
    a.download = 'response.json';
    a.click();
}


document.getElementById("Save").addEventListener("click", handleResponse);

