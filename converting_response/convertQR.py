import json
from string import Template

import requests

SINGLE_QR = Template("""
        {
            "linkId": "$linkId",
            "answer": [
                {
                    "valueString": "$answer"
                }
            ]
        }""")
PREFIX_RESPONSE = """{
    "resourceType": "QuestionnaireResponse",
    "meta": {
        "profile": [
            "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaireresponse|2.7"
        ],
        "tag": [
            {
                "code": "lformsVersion: 30.0.0"
            }
        ]
    },
    "status": "completed",
    "authored": "2022-09-05T22:24:09.522Z",
    "item": ["""
SUFFIX_RESPONSE = Template("""    ],
    "subject": {
        "reference": "Patient/$patient_id"
    },
    "extension": {
        "score": $score,
        "questionnaire_id": "$questionnaire_id",
        "encounter_id": "$encounter_id"
    }
}
""")
POST_RESPONSE_URL = "https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse/"

HEADERS = {"Content-Type": "application/json"}
def convert_to_qr():
    with open ('smartTrialNewFormat.json', 'r') as f:
        all_patients__responses = json.loads(f.read()).get('responses')

    for single_patient_response in all_patients__responses:
        all_questions_responses = single_patient_response.get('response')
        result = PREFIX_RESPONSE
        patient_id = single_patient_response.get('patient_id')
        questionnaire_id = single_patient_response.get('questionnaire_id')
        encounter_id = single_patient_response.get('encounter_id')
        print("patient_id: ", patient_id, "\nquestionnaire_id: ", questionnaire_id,
                "encounter_id: ", encounter_id)
        # for question_id, single_answer in all_questions_responses.items():
        responses_list_length = len(all_questions_responses.keys())
        for i in range(responses_list_length):
            question_id = list(all_questions_responses.keys())[i]
            answer = list(all_questions_responses.values())[i]
            formatted_response = SINGLE_QR.substitute(linkId = question_id, answer = answer)
            result += formatted_response
            if i != responses_list_length - 1:
                result+=','
            else:
                result+='\n'
        formatted_response = SUFFIX_RESPONSE.substitute(patient_id = patient_id, score = json.dumps(None), questionnaire_id = questionnaire_id, encounter_id = encounter_id)
        result += formatted_response
#         with open ('done_response.json', 'w') as f:
#             f.write(result)
        print(result)
        x = requests.post(url = POST_RESPONSE_URL, json = json.loads(result), headers=HEADERS).json()
        print("response "+x)
        break

convert_to_qr()

