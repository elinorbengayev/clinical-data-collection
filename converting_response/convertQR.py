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
PREFIX_RESPONSE = Template("""{
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
    "authored": "$authored_date",
    "item": [""")
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

TOTAL_SCORE_IDS = [
        "6d5a9f6c-cc2c-4f1a-9784-722ef2123c83",
        "2aa92bec-6bd3-4f62-9575-bbe7486ef713",
        "daf62842-5c9a-4edd-8e21-5082cfa8e273",
        "57fdae6c-97e0-44c4-a224-ca381c1972ca",
        "7ec05f8d-32bf-4689-9513-f84228996b97",
        "2b28a297-09ea-4ff8-b11f-19b841dbee61",
        "cbadb314-e547-4ac7-a95b-4ae5428dc31d"
]

def convert_to_qr():
    with open ('SmartTrial Data CHDR.json', 'r') as f:
        all_patients__responses = json.loads(f.read())
    del all_patients__responses["patient_id"]
    all_patients__responses = all_patients__responses[list(all_patients__responses.keys())[0]]
    for single_patient_response in all_patients__responses.values():
        all_questions_responses = single_patient_response.get('response')
        encounter_date = single_patient_response.get('encounter_date')
        result = PREFIX_RESPONSE.substitute(authored_date = encounter_date)
        patient_id = single_patient_response.get('patient_id')
        questionnaire_id = single_patient_response.get('questionnaire_id')
        encounter_id = single_patient_response.get('encounter_id')
        responses_list_length = len(all_questions_responses.keys())
        score = json.dumps(None)
        for i in range(responses_list_length):
            question_id = list(all_questions_responses.keys())[i]
            if(question_id in TOTAL_SCORE_IDS):
                score = list(all_questions_responses.values())[i]
            else:
                answer = list(all_questions_responses.values())[i]
                formatted_response = SINGLE_QR.substitute(linkId = question_id, answer = answer)
                result += formatted_response
                if i != responses_list_length - 1:
                    result+=','
                else:
                    result+='\n'
        formatted_response = SUFFIX_RESPONSE.substitute(patient_id = patient_id, score = score,
         questionnaire_id = questionnaire_id, encounter_id = encounter_id)
        result += formatted_response
#         with open ('done_response.json', 'w') as f:
#             f.write(result)
#         print(result)
#         x = requests.post(url = POST_RESPONSE_URL, json = json.loads(result), headers=HEADERS).json()
        print(result)
        break



convert_to_qr()



