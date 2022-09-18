


export async function getQuestionnaireResponse(parameter, value){
    let responses = null;
    await fetch("https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse?".concat(parameter,"='", value, "'"))
        .then(response => response.json())
        .then(async fhirQ => {
            responses = fhirQ
        })
    return responses;
}