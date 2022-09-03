

function redirect(){
    let q_id = document.getElementById("inputQuestionnaire").value;
    let p_id = document.getElementById("inputPatientID").value;
    console.log(q_id, p_id);
    window.location.replace("./index.html");
}

document.getElementById("submitDetails").addEventListener("click", redirect);

