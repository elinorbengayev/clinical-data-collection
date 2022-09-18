
import {presentQuestionnaire, displaySelfAssessment} from "../src/displayQuestionnaire.js"

function manager(){
    presentQuestionnaire("baseline")
    // presentQuestionnaire("PHQ-9")
    // if(displaySelfAssessment){
    //     for(let i = 0; i < displaySelfAssessment.length; i++){
    //         presentQuestionnaire(displaySelfAssessment[i])
    //     }
    // }
}

manager()