SINGLE_QR_INT = Template("""
        {
            "linkId": "$linkId",
            "answer": [
                {
                    "valueDecimal": $answer
                }
            ]
        }""")
SINGLE_QR_STR = Template("""
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
        "cbadb314-e547-4ac7-a95b-4ae5428dc31d",
        "ab8f8451-2e94-4d3a-a5f8-f1402e1b9f7c"
]
POST_RESPONSE_URL = "https://czp2w6uy37-vpce-0bdf8d65b826a59e3.execute-api.us-east-1.amazonaws.com/test/questionnaireResponse/"
INVALID_ANSWERS = [".b", ".c", ".d", ".e", ".n", "ns"]


def convert_to_qr():
    all_patients_responses = wr.s3.read_json(path='s3://clinical-smartrial/Questionnaire_response/SmartTrial Data Alivation.json').reset_index()
    response_groups = all_patients_responses.columns[2:]
    for group in response_groups:
        for index, single_patient_response in all_patients_responses[group][370:373].iteritems():
            try:
                valid_answer = True
                all_questions_responses = single_patient_response['response']
                encounter_date = single_patient_response.get('encounter_date')
                result = PREFIX_RESPONSE.substitute(authored_date = encounter_date)
                patient_id = single_patient_response['patient_id']
                questionnaire_id = single_patient_response['questionnaire_id']
                encounter_id = single_patient_response['encounter_id']
                if encounter_date == "NaT" and encounter_id == None:
                    continue
                responses_list_length = len(all_questions_responses.keys())
                score = json.dumps(None)
                score_response = None
                for i in range(responses_list_length):
                    question_id = list(all_questions_responses.keys())[i]
                    if(question_id == "E4_F48_MMSESubjectsArm"):
                        valid_answer = False
                        print("invalid response ", index)
                        break
                    answer = list(all_questions_responses.values())[i]
                    if answer in INVALID_ANSWERS:
                        valid_answer = False
                        print("invalid response ", index)
                        break
                    if (isinstance(answer, int)):
                        formatted_response = SINGLE_QR_INT.substitute(linkId = question_id, answer = answer)
                    if (isinstance(answer, str)):
                       formatted_response = SINGLE_QR_STR.substitute(linkId = question_id, answer = answer)
                    if(question_id in TOTAL_SCORE_IDS):
                        score = answer
                        score_response = formatted_response
                    else:
                        result += formatted_response
                        if i != responses_list_length - 1 or score_response:
                            result+=','
                if valid_answer:
                    if score_response:
                        result += score_response
                    else:
                        result += '\n'
                    formatted_response = SUFFIX_RESPONSE.substitute(patient_id = patient_id, score = score,
                     questionnaire_id = questionnaire_id, encounter_id = encounter_id)
                    result += formatted_response
                    result = json.loads(result)
                    request_result = requests.post(POST_RESPONSE_URL, json = result, headers=HEADERS)
                    if request_result.status_code == 200:
                        to_print = "OK"
                    if request_result.status_code != 200:
                        to_print = "Failed "+str(request_result.status_code)
                        print(request_result.content)
                    print("request number ", index, "is ", to_print, "encounter: ", encounter_id)
            except json.JSONDecodeError:
                print("ERROR")
                print("request number ", index, "encounter: ", encounter_id)
                print("answer ", answer)
                print(result)