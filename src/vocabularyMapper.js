/**
 * Vocabulary Mapper Application
 * Enables mapping of terminologies from target schema to source schema
 */

// Store the grid API references
let targetGridApi = null;
let sourceGridApi = null;

// Hard-coded schemas  (for testing purposes)
const targetSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Ovarian Cancer Cohort Consortium (OC3) Data Schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {
        "NEWID": {
            "type": "integer",
            "description": "Unique ID for each study participant (sequential)."
        },
        "ENTRYAGE": {
            "type": "number",
            "description": "Age at entry (QXAGE in years)."
        },
        "EDUCATION": {
            "description": "Highest level of education",
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 4, 5, 9, null],
            "enumDescriptions": [
                "Did not finish high school (1)",
                "High school (2)",
                "Some college (3)",
                "Completed college (4)",
                "Postgraduate (5)",
                "Unknown (9)",
                "Missing/not provided"
            ]
        },
        "HEIGHT": {
            "description": "Height in inches; set missing if <48 or >84.",
            "oneOf": [
                {
                    "type": "number",
                    "minimum": 48,
                    "maximum": 84
                },
                {"type": "null"}
            ]
        },
        "BMI": {
            "description": "Body mass index (kg/m^2); set missing if <14 or >60.",
            "oneOf": [
                {
                    "type": "number",
                    "minimum": 14,
                    "maximum": 60
                },
                {"type": "null"}
            ]
        },
        "ALC": {
            "type": ["number", "null"],
            "description": "Alcohol intake (grams/day). Null if missing.",
            "oneOf": [
                {
                    "type": "number",
                    "minimum": 0
                },
                {"type": "null"}
            ]
        },
        "SMOKE": {
            "description": "Smoking status",
            "type": ["integer", "null"],
            "enum": [0, 1, 2, null],
            "enumDescriptions": [
                "Never (0)",
                "Former (1)",
                "Current (2)",
                "Missing/unknown"
            ]
        }
    }
};

const sourceSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "NHANES 2015-16 Data Schema (DEMO, BMX, ALQ, and SMQ)",
    "type": "object",
    "additionalProperties": false,
    "properties": {
        "SEQN": {
            "type": "integer",
            "description": "Respondent sequence number. Respondent sequence number."
        },
        "SDDSRVYR": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                9,
                null
            ],
            "enumDescriptions": [
                "NHANES 2015-2016 public release",
                "Missing"
            ],
            "description": "Data release cycle. Data release cycle."
        },
        "RIDSTATR": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "Interviewed only",
                "Both interviewed and MEC examined",
                "Missing"
            ],
            "description": "Interview/Examination status. Interview and examination status of the participant."
        },
        "RIAGENDR": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "Male",
                "Female",
                "Missing"
            ],
            "description": "Gender. Gender of the participant."
        },
        "RIDAGEYR": {
            "type": [
                "integer",
                "null"
            ],
            "minimum": 0,
            "maximum": 80,
            "description": "Age in years at screening. Age in years of the participant at the time of screening. Individuals 80 and over are topcoded at 80 years of age."
        },
        "RIDAGEMN": {
            "type": [
                "integer",
                "null"
            ],
            "minimum": 0,
            "maximum": 24,
            "description": "Age in months at screening - 0 to 24 mos. Age in months of the participant at the time of screening. Reported for persons aged 24 months or younger at the time of exam (or screening if not examined)."
        },
        "RIDRETH1": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                5,
                null
            ],
            "enumDescriptions": [
                "Mexican American",
                "Other Hispanic",
                "Non-Hispanic White",
                "Non-Hispanic Black",
                "Other Race - Including Multi-Racial",
                "Missing"
            ],
            "description": "Race/Hispanic origin. Recode of reported race and Hispanic origin information."
        },
        "RIDRETH3": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                6,
                7,
                null
            ],
            "enumDescriptions": [
                "Mexican American",
                "Other Hispanic",
                "Non-Hispanic White",
                "Non-Hispanic Black",
                "Non-Hispanic Asian",
                "Other Race - Including Multi-Racial",
                "Missing"
            ],
            "description": "Race/Hispanic origin w/ NH Asian. Recode of reported race and Hispanic origin information, with Non-Hispanic Asian Category."
        },
        "RIDEXMON": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "November 1 through April 30",
                "May 1 through October 31",
                "Missing"
            ],
            "description": "Six month time period. Six month time period when the examination was performed - two categories: November 1 through April 30, May 1 through October 31."
        },
        "RIDEXAGM": {
            "type": [
                "integer",
                "null"
            ],
            "minimum": 0,
            "maximum": 239,
            "description": "Age in months at exam - 0 to 19 years. Age in months of the participant at the time of examination. Reported for persons aged 19 years or younger at the time of examination."
        },
        "DMQMILIZ": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                7,
                9,
                null
            ],
            "enumDescriptions": [
                "Yes",
                "No",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "Served active duty in US Armed Forces. {Have you/Has SP} ever served on active duty in the U.S. Armed Forces, military Reserves, or National Guard? (Active duty does not include training for the Reserves or National Guard, but does include activation, for service in the U.S. or in a foreign country, in support of military or humanitarian operations.)"
        },
        "DMQADFC": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                7,
                9,
                null
            ],
            "enumDescriptions": [
                "Yes",
                "No",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "Served in a foreign country. Did {you/SP} ever serve in a foreign country during a time of armed conflict or on a humanitarian or peace-keeping mission? (This would include National Guard or reserve or active duty monitoring or conducting peace keeping operations in Bosnia and Kosovo, in the Sinai between Egypt and Israel, or in response to the 2004 tsunami or Haiti in 2010.)"
        },
        "DMDBORN4": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                77,
                99,
                null
            ],
            "enumDescriptions": [
                "Born in 50 US states or Washington, DC",
                "Others",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "Country of birth. In what country {were you/was SP} born?"
        },
        "DMDCITZN": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                7,
                9,
                null
            ],
            "enumDescriptions": [
                "Citizen by birth or naturalization",
                "Not a citizen of the US",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "Citizenship status. {Are you/Is SP} a citizen of the United States? [Information about citizenship is being collected by the U.S. Public Health Service to perform health related research. Providing this information is voluntary and is collected under the authority of the Public Health Service Act. There will be no effect on pending immigration or citizenship petitions.]"
        },
        "DMDYRSUS": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                77,
                99,
                null
            ],
            "enumDescriptions": [
                "Less than 1 year",
                "1 year or more, but less than 5 years",
                "5 year or more, but less than 10 years",
                "10 year or more, but less than 15 years",
                "15 year or more, but less than 20 years",
                "20 year or more, but less than 30 years",
                "30 year or more, but less than 40 years",
                "40 year or more, but less than 50 years",
                "50 years or more",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "Length of time in US. Length of time the participant has been in the US."
        },
        "DMDEDUC3": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                55,
                66,
                77,
                99,
                null
            ],
            "enumDescriptions": [
                "Never attended / kindergarten only",
                "1st grade",
                "2nd grade",
                "3rd grade",
                "4th grade",
                "5th grade",
                "6th grade",
                "7th grade",
                "8th grade",
                "9th grade",
                "10th grade",
                "11th grade",
                "12th grade, no diploma",
                "High school graduate",
                "GED or equivalent",
                "More than high school",
                "Less than 5th grade",
                "Less than 9th grade",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "Education level - Children/Youth 6-19. What is the highest grade or level of school completed or the highest degree received?"
        },
        "DMDEDUC2": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                5,
                7,
                9,
                null
            ],
            "enumDescriptions": [
                "Less than 9th grade",
                "9-11th grade (Includes 12th grade with no diploma)",
                "High school graduate/GED or equivalent",
                "Some college or AA degree",
                "College graduate or above",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "Education level - Adults 20+. What is the highest grade or level of school completed or the highest degree received?"
        },
        "DMDMARTL": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                5,
                6,
                77,
                99,
                null
            ],
            "enumDescriptions": [
                "Married",
                "Widowed",
                "Divorced",
                "Separated",
                "Never married",
                "Living with partner",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "Marital status. Marital status."
        },
        "RIDEXPRG": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                null
            ],
            "enumDescriptions": [
                "Yes, positive lab pregnancy test or self-reported pregnant at exam",
                "The participant was not pregnant at exam",
                "Cannot ascertain if the participant is pregnant at exam",
                "Missing"
            ],
            "description": "Pregnancy status at exam. Pregnancy status for females between 20 and 44 years of age at the time of MEC exam."
        },
        "SIALANG": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "English",
                "Spanish",
                "Missing"
            ],
            "description": "Language of SP Interview. Language of the Sample Person Interview Instrument."
        },
        "SIAPROXY": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "Yes",
                "No",
                "Missing"
            ],
            "description": "Proxy used in SP Interview?. Was a Proxy respondent used in conducting the Sample Person (SP) interview?"
        },
        "SIAINTRP": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "Yes",
                "No",
                "Missing"
            ],
            "description": "Interpreter used in SP Interview?. Was an interpreter used to conduct the Sample Person (SP) interview?"
        },
        "FIALANG": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "English",
                "Spanish",
                "Missing"
            ],
            "description": "Language of Family Interview. Language of the Family Interview Instrument."
        },
        "FIAPROXY": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "Yes",
                "No",
                "Missing"
            ],
            "description": "Proxy used in Family Interview?. Was a Proxy respondent used in conducting the Family Interview?"
        },
        "FIAINTRP": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "Yes",
                "No",
                "Missing"
            ],
            "description": "Interpreter used in Family Interview?. Was an interpreter used to conduct the Family interview?"
        },
        "MIALANG": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "English",
                "Spanish",
                "Missing"
            ],
            "description": "Language of MEC Interview. Language of the MEC CAPI Interview Instrument."
        },
        "MIAPROXY": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "Yes",
                "No",
                "Missing"
            ],
            "description": "Proxy used in MEC Interview?. Was a Proxy respondent used in conducting the MEC CAPI Interview?"
        },
        "MIAINTRP": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "Yes",
                "No",
                "Missing"
            ],
            "description": "Interpreter used in MEC Interview?. Was an interpreter used to conduct the MEC CAPI interview?"
        },
        "AIALANGA": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                null
            ],
            "enumDescriptions": [
                "English",
                "Spanish",
                "Asian languages",
                "Missing"
            ],
            "description": "Language of ACASI Interview. Language of the MEC ACASI Interview Instrument."
        },
        "DMDHHSIZ": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                null
            ],
            "enumDescriptions": [
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7 or more people in the Household",
                "Missing"
            ],
            "description": "Total number of people in the Household. Total number of people in the Household."
        },
        "DMDFMSIZ": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                null
            ],
            "enumDescriptions": [
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7 or more people in the Family",
                "Missing"
            ],
            "description": "Total number of people in the Family. Total number of people in the Family."
        },
        "DMDHHSZA": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                0,
                1,
                2,
                3,
                null
            ],
            "enumDescriptions": [
                "0",
                "1",
                "2",
                "3 or more",
                "Missing"
            ],
            "description": "# of children 5 years or younger in HH. Number of children aged 5 years or younger in the household."
        },
        "DMDHHSZB": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                0,
                1,
                2,
                3,
                4,
                null
            ],
            "enumDescriptions": [
                "0",
                "1",
                "2",
                "3",
                "4 or more",
                "Missing"
            ],
            "description": "# of children 6-17 years old in HH. Number of children aged 6-17 years old in the household."
        },
        "DMDHHSZE": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                0,
                1,
                2,
                3,
                null
            ],
            "enumDescriptions": [
                "0",
                "1",
                "2",
                "3 or more",
                "Missing"
            ],
            "description": "# of adults 60 years or older in HH. Number of adults aged 60 years or older in the household."
        },
        "DMDHRGND": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                null
            ],
            "enumDescriptions": [
                "Male",
                "Female",
                "Missing"
            ],
            "description": "HH ref person's gender. HH reference person's gender."
        },
        "DMDHRAGE": {
            "type": [
                "integer",
                "null"
            ],
            "minimum": 18,
            "maximum": 80,
            "description": "HH ref person's age in years. HH reference person's age in years."
        },
        "DMDHRBR4": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                77,
                99,
                null
            ],
            "enumDescriptions": [
                "Born in 50 US states or Washington, DC",
                "Others",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "HH ref person's country of birth. HH reference person's country of birth."
        },
        "DMDHREDU": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                5,
                7,
                9,
                null
            ],
            "enumDescriptions": [
                "Less Than 9th Grade",
                "9-11th Grade (Includes 12th grade with no diploma)",
                "High School Grad/GED or Equivalent",
                "Some College or AA degree",
                "College Graduate or above",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "HH ref person's education level. HH reference person's education level."
        },
        "DMDHRMAR": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                5,
                6,
                77,
                99,
                null
            ],
            "enumDescriptions": [
                "Married",
                "Widowed",
                "Divorced",
                "Separated",
                "Never married",
                "Living with partner",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "HH ref person's marital status. HH reference person's marital status."
        },
        "DMDHSEDU": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                5,
                7,
                9,
                null
            ],
            "enumDescriptions": [
                "Less Than 9th Grade",
                "9-11th Grade (Includes 12th grade with no diploma)",
                "High School Grad/GED or Equivalent",
                "Some College or AA degree",
                "College Graduate or above",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "HH ref person's spouse's education level. HH reference person's spouse's education level."
        },
        "WTINT2YR": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 3293.928267,
            "maximum": 233755.84185,
            "description": "Full sample 2 year interview weight. Full sample 2 year interview weight."
        },
        "WTMEC2YR": {
            "oneOf": [
                {
                    "type": "number",
                    "minimum": 3419.259085,
                    "maximum": 242386.66077
                },
                {
                    "type": "integer",
                    "enum": [
                        0
                    ]
                },
                {
                    "type": "null"
                }
            ],
            "description": "Full sample 2 year MEC exam weight. Full sample 2 year MEC exam weight."
        },
        "SDMVPSU": {
            "type": [
                "integer",
                "null"
            ],
            "minimum": 1,
            "maximum": 2,
            "description": "Masked variance pseudo-PSU. Masked variance unit pseudo-PSU variable for variance estimation."
        },
        "SDMVSTRA": {
            "type": [
                "integer",
                "null"
            ],
            "minimum": 119,
            "maximum": 133,
            "description": "Masked variance pseudo-stratum. Masked variance unit pseudo-stratum variable for variance estimation."
        },
        "INDHHIN2": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                12,
                13,
                14,
                15,
                77,
                99,
                null
            ],
            "enumDescriptions": [
                "$ 0 to $ 4,999",
                "$ 5,000 to $ 9,999",
                "$10,000 to $14,999",
                "$15,000 to $19,999",
                "$20,000 to $24,999",
                "$25,000 to $34,999",
                "$35,000 to $44,999",
                "$45,000 to $54,999",
                "$55,000 to $64,999",
                "$65,000 to $74,999",
                "$20,000 and Over",
                "Under $20,000",
                "$75,000 to $99,999",
                "$100,000 and Over",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Annual household income. Total household income (reported as a range value in dollars)."
        },
        "INDFMIN2": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                12,
                13,
                14,
                15,
                77,
                99,
                null
            ],
            "enumDescriptions": [
                "$ 0 to $ 4,999",
                "$ 5,000 to $ 9,999",
                "$10,000 to $14,999",
                "$15,000 to $19,999",
                "$20,000 to $24,999",
                "$25,000 to $34,999",
                "$35,000 to $44,999",
                "$45,000 to $54,999",
                "$55,000 to $64,999",
                "$65,000 to $74,999",
                "$20,000 and Over",
                "Under $20,000",
                "$75,000 to $99,999",
                "$100,000 and Over",
                "Refused",
                "Don't Know",
                "Missing"
            ],
            "description": "Annual family income. Total family income (reported as a range value in dollars)."
        },
        "INDFMPIR": {
            "oneOf": [
                {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 4.99
                },
                {
                    "type": "number",
                    "const": 5
                },
                {
                    "type": "null"
                }
            ],
            "description": "Ratio of family income to poverty. A ratio of family income to poverty guidelines."
        },
        "BMDSTATS": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [1, 2, 3, 4, null],
            "enumDescriptions": [
                "Complete data for age group",
                "Partial:  Only height and weight obtained",
                "Other partial exam",
                "No body measures exam data",
                "Missing"
            ],
            "description": "Body Measures Component Status Code. Body Measures Component status Code."
        },
        "BMXWT": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 3.6,
            "maximum": 198.9,
            "description": "Weight (kg). Weight (kg)."
        },
        "BMIWT": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [1, 3, 4, null],
            "enumDescriptions": [
                "Could not obtain",
                "Clothing",
                "Medical appliance",
                "Missing"
            ],
            "description": "Weight Comment. Weight Comment."
        },
        "BMXRECUM": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 49.3,
            "maximum": 116.7,
            "description": "Recumbent Length (cm). Recumbent Length (cm)."
        },
        "BMIRECUM": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [1, 3, null],
            "enumDescriptions": [
                "Could not obtain",
                "Not straight",
                "Missing"
            ],
            "description": "Recumbent Length Comment. Recumbent Length Comment."
        },
        "BMXHEAD": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 36.2,
            "maximum": 48.5,
            "description": "Head Circumference (cm). Head Circumference (cm)."
        },
        "BMIHEAD": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [1, null],
            "enumDescriptions": [
                "Could not obtain",
                "Missing"
            ],
            "description": "Head Circumference Comment. Head Circumference Comment."
        },
        "BMXHT": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 80.7,
            "maximum": 202.7,
            "description": "Standing Height (cm). Standing Height (cm)."
        },
        "BMIHT": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [1, 3, null],
            "enumDescriptions": [
                "Could not obtain",
                "Not straight",
                "Missing"
            ],
            "description": "Standing Height Comment. Standing Height Comment."
        },
        "BMXBMI": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 11.5,
            "maximum": 67.3,
            "description": "Body Mass Index (kg/m**2). Body Mass Index (kg/m**2)."
        },
        "BMDBMIC": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [1, 2, 3, 4, null],
            "enumDescriptions": [
                "Underweight",
                "Normal weight",
                "Overweight",
                "Obese",
                "Missing"
            ],
            "description": "BMI Category - Children/Youth. BMI Category - Children/Youth."
        },
        "BMXLEG": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 24,
            "maximum": 51.5,
            "description": "Upper Leg Length (cm). Upper Leg Length (cm)."
        },
        "BMILEG": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [1, null],
            "enumDescriptions": [
                "Could not obtain",
                "Missing"
            ],
            "description": "Upper Leg Length Comment. Upper Leg Length Comment."
        },
        "BMXARML": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 10,
            "maximum": 47.4,
            "description": "Upper Arm Length (cm). Upper Arm Length (cm)."
        },
        "BMIARML": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [1, null],
            "enumDescriptions": [
                "Could not obtain",
                "Missing"
            ],
            "description": "Upper Arm Length Comment. Upper Arm Length Comment."
        },
        "BMXARMC": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 10.1,
            "maximum": 58.4,
            "description": "Arm Circumference (cm). Arm Circumference (cm)."
        },
        "BMIARMC": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [1, null],
            "enumDescriptions": [
                "Could not obtain",
                "Missing"
            ],
            "description": "Arm Circumference Comment. Arm Circumference Comment."
        },
        "BMXWAIST": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 40,
            "maximum": 171.6,
            "description": "Waist Circumference (cm). Waist Circumference (cm)."
        },
        "BMIWAIST": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [1, null],
            "enumDescriptions": [
                "Could not obtain",
                "Missing"
            ],
            "description": "Waist Circumference Comment. Waist Circumference Comment."
        },
        "BMXSAD1": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 9.5,
            "maximum": 40.7,
            "description": "Sagittal Abdominal Diameter 1st (cm). Sagittal Abdominal Diameter 1st (cm)."
        },
        "BMXSAD2": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 9.7,
            "maximum": 40.9,
            "description": "Sagittal Abdominal Diameter 2nd (cm). Sagittal Abdominal Diameter 2nd (cm)."
        },
        "BMXSAD3": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 11.3,
            "maximum": 39.5,
            "description": "Sagittal Abdominal Diameter 3rd (cm). Sagittal Abdominal Diameter 3rd (cm)."
        },
        "BMXSAD4": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 11.1,
            "maximum": 39.8,
            "description": "Sagittal Abdominal Diameter 4th (cm). Sagittal Abdominal Diameter 4th (cm)."
        },
        "BMDAVSAD": {
            "type": [
                "number",
                "null"
            ],
            "minimum": 9.6,
            "maximum": 40.8,
            "description": "Average Sagittal Abdominal Diameter (cm). Average Sagittal Abdominal Diameter (cm)."
        },
        "BMDSADCM": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [1, 2, 3, 4, 5, null],
            "enumDescriptions": [
                "Could not obtain",
                "SP unable to comply with exam instruction",
                "SP discomfort",
                "Use of positioning cushion",
                "Other",
                "Missing"
            ],
            "description": "Sagittal Abdominal Diameter Comment. Sagittal Abdominal Diameter Comment."
        },
        "ALQ101": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                7,
                9,
                null
            ],
            "enumDescriptions": [
                "Yes",
                "No",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Had at least 12 alcohol drinks/1 yr? In any one year, {have you/has SP} had at least 12 drinks of any type of alcoholic beverage? By a drink, I mean a 12 oz. beer, a 5 oz. glass of wine, or a one and a half ounces of liquor."
        },
        "ALQ110": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                7,
                9,
                null
            ],
            "enumDescriptions": [
                "Yes",
                "No",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Had at least 12 alcohol drinks/lifetime? In {your/SP's} entire life, {have you/has he/has she} had at least 12 drinks of any type of alcoholic beverage?"
        },
        "ALQ120Q": {
            "oneOf": [
                {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 366,
                    "description": "Numeric response between 0 and 366 representing the number of days."
                },
                {
                    "type": "integer",
                    "enum": [
                        777
                    ],
                    "enumDescriptions": [
                        "Refused"
                    ]
                },
                {
                    "type": "integer",
                    "enum": [
                        999
                    ],
                    "enumDescriptions": [
                        "Don't know"
                    ]
                },
                {
                    "type": "null"
                }
            ],
            "description": "How often drink alcohol over past 12 mos. In the past 12 months, how often did {you/SP} drink any type of alcoholic beverage? PROBE: How many days per week, per month, or per year did {you/SP} drink? ENTER QUANTITY. ENTER '0' FOR NEVER."
        },
        "ALQ120U": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                7,
                9,
                null
            ],
            "enumDescriptions": [
                "Week",
                "Month",
                "Year",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "# days drink alcohol per wk, mo, yr. UNIT OF MEASURE. ENTER UNIT."
        },
        "ALQ130": {
            "oneOf": [
                {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 14,
                    "description": "Numeric response between 1 and 14 representing average number of drinks per day."
                },
                {
                    "type": "integer",
                    "enum": [
                        15
                    ],
                    "enumDescriptions": [
                        "15 drinks or more"
                    ]
                },
                {
                    "type": "integer",
                    "enum": [
                        777
                    ],
                    "enumDescriptions": [
                        "Refused"
                    ]
                },
                {
                    "type": "integer",
                    "enum": [
                        999
                    ],
                    "enumDescriptions": [
                        "Don't know"
                    ]
                },
                {
                    "type": "null"
                }
            ],
            "description": "Avg # alcoholic drinks/day - past 12 mos. In the past 12 months, on those days that {you/SP} drank alcoholic beverages, on the average, how many drinks did {you/he/she} have? By a drink, I mean a 12 oz. beer, a 5 oz. glass of wine, or one and a half ounces of liquor. ENTER # OF DRINKS. IF LESS THAN 1 DRINK, ENTER '1'."
        },
        "ALQ141Q": {
            "oneOf": [
                {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 365,
                    "description": "Numeric response between 0 and 365 representing the number of days."
                },
                {
                    "type": "integer",
                    "enum": [
                        777
                    ],
                    "enumDescriptions": [
                        "Refused"
                    ]
                },
                {
                    "type": "integer",
                    "enum": [
                        999
                    ],
                    "enumDescriptions": [
                        "Don't know"
                    ]
                },
                {
                    "type": "null"
                }
            ],
            "description": "# days have 4/5 drinks - past 12 mos. In the past 12 months, on how many days did {you/SP} have {Display number} or more drinks of any alcoholic beverage? PROBE: How many days per week, per month, or per year did {you/SP} have {DISPLAY NUMBER} or more drinks in a single day? ENTER QUANTITY. ENTER '0' FOR NONE. CAPI INSTRUCTION: IF SP = MALE, DISPLAY = 5; IF SP = FEMALE, DISPLAY = 4."
        },
        "ALQ141U": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                3,
                7,
                9,
                null
            ],
            "enumDescriptions": [
                "Week",
                "Month",
                "Year",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "# days per week, month, year? UNIT OF MEASURE. ENTER UNIT."
        },
        "ALQ151": {
            "type": [
                "integer",
                "null"
            ],
            "enum": [
                1,
                2,
                7,
                9,
                null
            ],
            "enumDescriptions": [
                "Yes",
                "No",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Ever have 4/5 or more drinks every day? Was there ever a time or times in {your/SP's} life when {you/he/she} drank {DISPLAY NUMBER} or more drinks of any kind of alcoholic beverage almost every day? CAPI INSTRUCTION: IF SP = MALE, DISPLAY = 5; IF SP = FEMALE, DISPLAY = 4."
        },
        "ALQ160": {
            "oneOf": [
                {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 18,
                    "description": "Numeric response between 0 and 18 representing the number of days."
                },
                {
                    "type": "integer",
                    "enum": [
                        20
                    ],
                    "enumDescriptions": [
                        "20 days or more"
                    ]
                },
                {
                    "type": "integer",
                    "enum": [
                        777
                    ],
                    "enumDescriptions": [
                        "Refused"
                    ]
                },
                {
                    "type": "integer",
                    "enum": [
                        999
                    ],
                    "enumDescriptions": [
                        "Don't know"
                    ]
                },
                {
                    "type": "null"
                }
            ],
            "description": "# days have 4/5 or more drinks in 2 hrs. During the past 30 days, how many times did {you/SP} drink {DISPLAY NUMBER} or more drinks of any kind of alcohol in about two hours? ENTER QUANTITY. ENTER '0' FOR NEVER. CAPI INSTRUCTION: IF SP = MALE, DISPLAY = 5; IF SP = FEMALE, DISPLAY = 4."
        },
        "SMQ020": {
            "type": ["integer", "null"],
            "enum": [1, 2, 7, 9, null],
            "enumDescriptions": [
                "Yes",
                "No",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Smoked at least 100 cigarettes in life. These next questions are about cigarette smoking and other tobacco use. {Have you/Has SP} smoked at least 100 cigarettes in {your/his/her} entire life?"
        },
        "SMD030": {
            "oneOf": [
                {
                    "type": "integer",
                    "minimum": 7,
                    "maximum": 58
                },
                {"type": "integer", "enum": [0]},
                {"type": "integer", "enum": [777]},
                {"type": "integer", "enum": [999]},
                {"type": "null"}
            ],
            "description": "Age started smoking cigarettes regularly. How old {were you/was SP} when {you/s/he} first started to smoke cigarettes fairly regularly? (ENTER AGE IN YEARS)"
        },
        "SMQ040": {
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 7, 9, null],
            "enumDescriptions": [
                "Every day",
                "Some days",
                "Not at all",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Do you now smoke cigarettes? {Do you/Does SP} now smoke cigarettes?"
        },
        "SMQ050Q": {
            "oneOf": [
                {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 49
                },
                {"type": "integer", "enum": [66666]},
                {"type": "integer", "enum": [77777]},
                {"type": "integer", "enum": [99999]},
                {"type": "null"}
            ],
            "description": "How long since quit smoking cigarettes. How long has it been since {you/SP} quit smoking cigarettes? (ENTER NUMBER (OF DAYS, WEEKS, MONTHS OR YEARS))"
        },
        "SMQ050U": {
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 4, 7, 9, null],
            "enumDescriptions": [
                "Days",
                "Weeks",
                "Months",
                "Years",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Unit of measure (day/week/month/year). UNIT OF MEASURE (ENTER UNIT)"
        },
        "SMD055": {
            "oneOf": [
                {
                    "type": "integer",
                    "minimum": 13,
                    "maximum": 79
                },
                {"type": "integer", "enum": [80]},
                {"type": "integer", "enum": [777]},
                {"type": "integer", "enum": [999]},
                {"type": "null"}
            ],
            "description": "Age last smoked cigarettes regularly. How old {were you/was SP} when {you/s/he} last smoked cigarettes (fairly regularly)? (ENTER AGE IN YEARS.)"
        },
        "SMD057": {
            "oneOf": [
                {
                    "type": "integer",
                    "minimum": 2,
                    "maximum": 90
                },
                {"type": "integer", "enum": [1]},
                {"type": "integer", "enum": [95]},
                {"type": "integer", "enum": [777]},
                {"type": "integer", "enum": [999]},
                {"type": "null"}
            ],
            "description": "# cigarettes smoked per day when quit. At that time, about how many cigarettes did {you/SP} usually smoke per day? (1 PACK EQUALS 20 CIGARETTES. IF LESS THAN 1 PER DAY, ENTER 1. IF 95 OR MORE PER DAY, ENTER 95. ENTER NUMBER (OF CIGARETTES))."
        },
        "SMQ078": {
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 4, 5, 6, 7, 77, 99, null],
            "enumDescriptions": [
                "Within 5 minutes",
                "From 6 to 30 minutes",
                "From more than 30 minutes to one hour",
                "From more than 1 hour to 2 hours",
                "From more than 2 hours to 3 hours",
                "From more than 3 hours to 4 hours",
                "More than 4 hours",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "How soon after waking do you smoke. How soon after you wake up do you smoke? Would you say . . ."
        },
        "SMD641": {
            "oneOf": [
                {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 30
                },
                {"type": "integer", "enum": [77]},
                {"type": "integer", "enum": [99]},
                {"type": "null"}
            ],
            "description": "# days smoked cigs during past 30 days. On how many of the past 30 days did {you/SP} smoke a cigarette? (ENTER NUMBER (OF DAYS))."
        },
        "SMD650": {
            "oneOf": [
                {
                    "type": "integer",
                    "minimum": 2,
                    "maximum": 60
                },
                {"type": "integer", "enum": [1]},
                {"type": "integer", "enum": [95]},
                {"type": "integer", "enum": [777]},
                {"type": "integer", "enum": [999]},
                {"type": "null"}
            ],
            "description": "Avg # cigarettes/day during past 30 days. During the past 30 days, on the days that {you/SP} smoked, about how many cigarettes did {you/s/he} smoke per day? (1 PACK EQUALS 20 CIGARETTES. IF LESS THAN 1 PER DAY, ENTER 1. IF 95 OR MORE PER DAY, ENTER 95. ENTER NUMBER (OF CIGARETTES) (PER DAY))."
        },
        "SMD093": {
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 4, 7, 9, null],
            "enumDescriptions": [
                "Yes",
                "No",
                "No usual brand",
                "Rolls own",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "May I please see the pack of cigarettes. May I please see the pack for the brand of cigarettes {you usually smoke/SP usually smokes}."
        },
        "SMDUPCA": {
            "type": "string",
            "maxLength": 12,
            "description": "Cig 12-digit Universal Product Code-UPC. Cigarette 12-digit Universal Product Code (UPC). Variable type - Character $12."
        },
        "SMD100BR": {
            "type": "string",
            "maxLength": 50,
            "description": "Cigarette Brand/sub-brand. BRAND OF CIGARETTES SMOKED BY SP (SUB-BRAND INCLUDED IF APPLICABLE AND AVAILABLE). Variable type - Character $50."
        },
        "SMD100FL": {
            "type": ["integer", "null"],
            "enum": [0, 1, null],
            "enumDescriptions": [
                "Non-filter",
                "Filter",
                "Missing"
            ],
            "description": "Cigarette Filter type. CIGARETTE PRODUCT FILTERED OR NON-FILTERED."
        },
        "SMD100MN": {
            "type": ["integer", "null"],
            "enum": [0, 1, null],
            "enumDescriptions": [
                "Non-menthol",
                "Menthol",
                "Missing"
            ],
            "description": "Cigarette Menthol indicator. CIGARETTE PRODUCT MENTHOLATED OR NON-MENTHOLATED."
        },
        "SMD100LN": {
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 4, null],
            "enumDescriptions": [
                "Regular (68-72 mm)",
                "King (79-88 mm)",
                "Long (94-101 mm)",
                "Ultra long (110-121 mm)",
                "Missing"
            ],
            "description": "Cigarette Length. CIGARETTE PRODUCT LENGTH."
        },
        "SMD100TR": {
            "oneOf": [
                {"type": "integer", "minimum": 6, "maximum": 24},
                {"type": "null"}
            ],
            "description": "FTC Tar Content. CIGARETTE TAR CONTENT."
        },
        "SMD100NI": {
            "oneOf": [
                {"type": "number", "minimum": 0.5, "maximum": 2},
                {"type": "null"}
            ],
            "description": "FTC Nicotine Content. CIGARETTE NICOTINE CONTENT."
        },
        "SMD100CO": {
            "oneOf": [
                {"type": "integer", "minimum": 1, "maximum": 19},
                {"type": "null"}
            ],
            "description": "FTC Carbon Monoxide Content. CIGARETTE CARBON MONOXIDE CONTENT."
        },
        "SMQ621": {
            "type": ["integer", "null"],
            "description": "Cigarettes smoked in entire life. The following questions are about cigarette smoking and other tobacco use. Do not include cigars or marijuana. About how many cigarettes have you smoked in your entire life?"
        },
        "SMD630": {
            "oneOf": [
                {"type": "integer", "minimum": 6, "maximum": 19},
                {"type": "null"}
            ],
            "description": "Age first smoked whole cigarette. How old were you when you smoked a whole cigarette for the first time? (Hard Edits: 6 to 19)"
        },
        "SMQ661": {
            "type": "string",
            "description": "Brand of cigarettes smoked past 30 days. During the past 30 days, on the days that you smoked, which brand of cigarettes did you usually smoke?"
        },
        "SMQ665A": {
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 4, 5, 6, 7, 8, 77, 99, null],
            "enumDescriptions": [
                "MARLBORO RED",
                "MARLBORO RED 83S",
                "MARLBORO GOLD",
                "MARLBORO GOLD MENTHOL",
                "MARLBORO SILVER",
                "MARLBORO BLACK",
                "MARLBORO MENTHOL",
                "OTHER MARLBORO",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Marlboro variety. Please select the Marlboro pack that looks most like the brand that you smoke. If the pack you smoke is not shown, select 'other Marlboro.'"
        },
        "SMQ665B": {
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 4, 5, 6, 7, 77, 99, null],
            "enumDescriptions": [
                "CAMEL",
                "CAMEL BLUE",
                "CAMEL CRUSH",
                "CAMEL CRUSH BOLD",
                "CAMEL MENTHOL",
                "CAMEL MENTHOL SILVER",
                "OTHER CAMEL",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Camel variety. Please select the Camel pack that looks most like the brand that you smoke. If the pack you smoke is not shown, select 'other Camel.'"
        },
        "SMQ665C": {
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 77, 99, null],
            "enumDescriptions": [
                "NEWPORT",
                "NEWPORT MENTHOL GOLD",
                "OTHER NEWPORT",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Newport variety. Please select the Newport pack that looks most like the brand that you smoke. If the pack you smoke is not shown, select 'other Newport.'"
        },
        "SMQ665D": {
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 4, 5, 6, 7, 8, 9, 77, 99, null],
            "enumDescriptions": [
                "BASIC",
                "DORAL RED 100S",
                "DORAL MENTHOL GOLD BOX 100S",
                "GPC",
                "GPC MENTHOL",
                "KOOL BLUE MENTHOL 100S",
                "KOOL TRUE MENTHOL",
                "VIRGINIA SLIMS",
                "OTHER BRAND",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Other brand. Please select the pack that looks most like the brand that you smoke. If the pack you smoke is not shown, select 'other brand of cigarette.'"
        },
        "SMQ670": {
            "type": ["integer", "null"],
            "enum": [1, 2, 7, 9, null],
            "enumDescriptions": [
                "Yes",
                "No",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Tried to quit smoking. During the past 12 months, have you stopped smoking for one day or longer because you were trying to quit smoking?"
        },
        "SMQ848": {
            "oneOf": [
                {"type": "integer", "minimum": 1, "maximum": 20},
                {"type": "integer", "enum": [777]},
                {"type": "integer", "enum": [999]},
                {"type": "null"}
            ],
            "description": "# times stopped smoking cigarettes. During the past 12 months, how many times {have you/has SP} stopped smoking cigarettes because {you were/he was/she was} trying to quit smoking? (ENTER NUMBER OF TIMES (1-20 TIMES); IF MORE THAN 20 TIMES ENTER 20)"
        },
        "SMQ852Q": {
            "oneOf": [
                {"type": "integer", "minimum": 0, "maximum": 480},
                {"type": "integer", "enum": [7777]},
                {"type": "integer", "enum": [9999]},
                {"type": "null"}
            ],
            "description": "How long were you able to stop smoking. The last time {you/SP} tried to quit, how long {were you/was he/was she} able to stop smoking? (ENTER NUMBER (OF DAYS, WEEKS OR MONTHS))"
        },
        "SMQ852U": {
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 7, 9, null],
            "enumDescriptions": [
                "Days",
                "Weeks",
                "Months",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Unit of measure (day/week/month/year). The last time {you/SP} tried to quit, how long {were you/was he/was she} able to stop smoking? (ENTER UNIT)"
        },
        "SMQ925": {
            "type": ["integer", "null"],
            "enum": [1, 2, 7, 9, null],
            "enumDescriptions": [
                "Yes",
                "No",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Ever smoked a cigarette even 1 time? {Have you/Has SP} ever smoked a cigarette even one time? (Question asked only if SMQ020 not equal 1.)"
        },
        "SMQ930": {
            "oneOf": [
                {"type": "integer", "minimum": 8, "maximum": 70},
                {"type": "integer", "enum": [7]},
                {"type": "integer", "enum": [77777]},
                {"type": "integer", "enum": [99999]},
                {"type": "null"}
            ],
            "description": "Age smoked first cigarette. How old {were you/was SP} the first time {you/he/she} smoked all or part of a cigarette? (Question asked only if SMQ020 not equal 1.)"
        },
        "SMQ935": {
            "type": ["integer", "null"],
            "enum": [1, 2, 3, 7, 9, null],
            "enumDescriptions": [
                "Every day",
                "Some Days",
                "Not at all",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Do you now smoke cigarettes? {Do you/Does SP} now smoke cigarettes? (Question asked only if SMQ020 not equal 1.)"
        },
        "SMQ080": {
            "oneOf": [
                {"type": "integer", "minimum": 0, "maximum": 30},
                {"type": "integer", "enum": [7777]},
                {"type": "integer", "enum": [9999]},
                {"type": "null"}
            ],
            "description": "# days smoked cigs during past 30 days. On how many of the past 30 days did {you/SP} smoke a cigarette? (Question asked only if SMQ020 not equal 1.; ENTER NUMBER (OF DAYS))"
        },
        "SMQ890": {
            "type": ["integer", "null"],
            "enum": [1, 2, 7, 9, null],
            "enumDescriptions": [
                "Yes",
                "No",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Ever smoked a cigar even 1 time? {Have you/Has SP} ever smoked a regular cigar, cigarillo or little filtered cigar even one time? (HAND CARD SMQ2)"
        },
        "SMQ895": {
            "oneOf": [
                {"type": "integer", "minimum": 0, "maximum": 30},
                {"type": "integer", "enum": [77]},
                {"type": "integer", "enum": [99]},
                {"type": "null"}
            ],
            "description": "How many days smoked a cigar? During the past 30 days, on how many days did {you/SP} smoke a regular cigar, cigarillo or little filtered cigar? (ALLOW '0' AS AN ENTRY; ENTER NUMBER OF DAYS)"
        },
        "SMQ900": {
            "type": ["integer", "null"],
            "enum": [1, 2, 7, 9, null],
            "enumDescriptions": [
                "Yes",
                "No",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Ever used an e-cigarette? The next question is about e-cigarettes. Have {you/SP} EVER used an e-cigarette EVEN ONE TIME? (HAND CARD SMQ3)"
        },
        "SMQ905": {
            "oneOf": [
                {"type": "integer", "minimum": 0, "maximum": 30},
                {"type": "integer", "enum": [77]},
                {"type": "integer", "enum": [99]},
                {"type": "null"}
            ],
            "description": "How many days used an e-cigarette? During the past 30 days, on how many days did {you/SP} use e-cigarettes? (ALLOW '0' AS AN ENTRY; ENTER NUMBER OF DAYS)"
        },
        "SMQ910": {
            "type": ["integer", "null"],
            "enum": [1, 2, 7, 9, null],
            "enumDescriptions": [
                "Yes",
                "No",
                "Refused",
                "Don't know",
                "Missing"
            ],
            "description": "Ever used smokeless tobacco? {Have you/Has SP} ever used smokeless tobacco even one time? (HAND CARD SMQ4)"
        },
        "SMQ915": {
            "oneOf": [
                {"type": "integer", "minimum": 0, "maximum": 30},
                {"type": "integer", "enum": [77]},
                {"type": "integer", "enum": [99]},
                {"type": "null"}
            ],
            "description": "How many days used smokeless tobacco? During the past 30 days, on how many days did {you/SP} use smokeless tobacco? (ALLOW '0' AS AN ENTRY; ENTER NUMBER OF DAYS)"
        },
        "SMAQUEX2": {
            "type": ["integer", "null"],
            "enum": [1, 2, null],
            "enumDescriptions": [
                "Home Interview (18+ Yrs)",
                "ACASI (12 - 17 Yrs)",
                "Missing"
            ],
            "description": "Questionnaire Mode Flag. Questionnaire Mode Flag."
        }
    }
};

/**
 * Add CSS styles for better AG-Grid appearance
 */
function addCustomStyles() {
    // Check if styles already exist
    if (document.getElementById('vm-grid-styles')) return;

    // Create style element
    const style = document.createElement('style');
    style.id = 'vm-grid-styles';
    style.textContent = `
    /* Existing styles */
    .ag-theme-alpine {
      --ag-foreground-color: rgb(55, 65, 81);
      --ag-header-foreground-color: rgb(55, 65, 81);
      --ag-header-background-color: rgb(243, 244, 246);
      --ag-odd-row-background-color: rgb(249, 250, 251);
      --ag-header-column-separator-display: block;
      --ag-header-column-separator-height: 50%;
      --ag-header-column-separator-width: 1px;
      --ag-header-column-separator-color: rgb(229, 231, 235);
      --ag-border-color: rgb(229, 231, 235);
      --ag-row-border-color: rgb(229, 231, 235);
      --ag-cell-horizontal-padding: 12px;
      --ag-selected-row-background-color: rgba(245, 158, 11, 0.1);
      font-family: inherit;
    }
    
    .ag-theme-alpine .ag-header-cell {
      font-weight: 600;
    }
    
    .ag-theme-alpine .ag-cell-value {
      padding-top: 6px;
      padding-bottom: 6px;
    }
    
    /* Custom style for mapped cells */
    .ag-theme-alpine .mapped-cell {
      background-color: rgba(5, 150, 105, 0.1);
    }
    
    /* Value Coding column specific styles */
    .value-coding-content {
      line-height: 1.2;
    }
    
    .value-coding-content .enum-item {
      margin-bottom: 2px;
      padding-bottom: 2px;
      border-bottom: 1px dashed rgba(0,0,0,0.05);
    }
    
    /* Last enum item shouldn't have a border or margin */
    .value-coding-content .enum-item:last-child {
      margin-bottom: 0;
      border-bottom: none;
    }
    
    /* Tooltip styling */
    .ag-tooltip {
      max-width: 400px;
      color: #374151;
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
  `;

    // Add to document head
    document.head.appendChild(style);
}

/**
 * Initializes the Vocabulary Mapper application
 * This is the main entry point called from app.js
 */
function initVocabularyMapperApp() {
    const container = document.getElementById('vocabulary-mapper-app');
    if (!container) return;

    // Clear any existing content
    container.innerHTML = '';

    // Add custom styles
    addCustomStyles();

    // Create app layout
    createAppLayout(container);

    // Initialize components
    initAgGrid('target', targetSchema);
    initAgGrid('source', sourceSchema);
    setupButtons();
    setupChatInterface();
    handleResponsiveGridSizing();
}

/**
 * Creates the main app layout
 */
function createAppLayout(container) {
    container.innerHTML = `
    <div class="mb-4">
      <h2 class="text-xl font-bold">Vocabulary Mapper</h2>
      <p class="text-gray-600">Map terminologies from target schema to source schema</p>
    </div>
    
    <!-- Target Schema Section -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Target Schema: ${targetSchema.title}</h3>
      <div id="target-schema-grid" class="ag-theme-alpine w-full h-80 rounded-md shadow-sm"></div>
    </div>
    
    <!-- Source Schema Section -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Source Schema: ${sourceSchema.title}</h3>
      <div id="source-schema-grid" class="ag-theme-alpine w-full h-80 rounded-md shadow-sm"></div>
    </div>
    
    <!-- Action Buttons -->
    <div class="flex flex-wrap justify-center gap-4 mb-6" id="action-buttons">
      <button id="flag-btn" class="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800">
        Flag
      </button>
      <button id="ask-llm-btn" class="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">
        Ask LLM
      </button>
      <button id="map-btn" class="bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700">
        Map
      </button>
      <button id="clear-btn" class="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50">
        Clear Selections
      </button>
    </div>
    
    <!-- Chat Interface -->
    <div id="vm-chat-interface" class="mt-4 border border-gray-200 rounded-md h-[400px] shadow-sm">
      <div class="h-full flex flex-col">
        <!-- File attachment section -->
        <div class="p-3 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center gap-2">
            <label for="vm-chat-file-upload" class="text-sm font-medium text-gray-700">Attach files:</label>
            <input id="vm-chat-file-upload" type="file" multiple 
                  class="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3
                         file:rounded file:border-0 file:text-sm file:font-medium
                         file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
          </div>
          <div id="vm-attached-files-list" class="mt-2 flex flex-wrap gap-2"></div>
        </div>
        
        <!-- Chat messages area -->
        <div id="vm-chat-messages" class="flex-grow p-4 overflow-y-auto">
          <div class="bg-gray-100 rounded-lg p-3 mb-3 max-w-3xl mx-auto">
            <p class="text-gray-800">I'm the epiHarmony vocabulary mapper assistant. I can help you map concepts between your source and target schemas.</p>
            <p class="text-gray-800 mt-2">Select variables from the target schema that you wish to work on and click "Ask LLM" to assign me the task of mapping that concept to the source schema.</p>
          </div>
        </div>
        
        <!-- Chat input area -->
        <div class="p-3 border-t border-gray-200 bg-gray-50">
          <div class="flex gap-2">
            <textarea id="vm-chat-input" placeholder="Type your message here..." rows="2"
                     class="flex-grow border border-gray-300 rounded-md p-2 text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"></textarea>
            <button id="vm-chat-send-btn" class="bg-amber-800 text-white px-4 py-2 rounded-md hover:bg-amber-700 self-end">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize AG-Grid with schema data
 */
function initAgGrid(type, schema) {
    const gridContainerId = `${type}-schema-grid`;
    const gridContainer = document.getElementById(gridContainerId);
    if (!gridContainer) {
        console.error(`Grid container not found: ${gridContainerId}`);
        return;
    }

    console.log(`Initializing AG-Grid for ${type} schema`);
    console.log('Schema:', schema);

    // Add loading indicator
    gridContainer.innerHTML = `
    <div class="flex items-center justify-center h-full">
      <div class="flex items-center space-x-2">
        <div class="animate-pulse rounded-full h-4 w-4 bg-amber-600"></div>
        <div class="animate-pulse rounded-full h-4 w-4 bg-amber-600" style="animation-delay: 0.2s"></div>
        <div class="animate-pulse rounded-full h-4 w-4 bg-amber-600" style="animation-delay: 0.4s"></div>
        <span class="text-gray-700 ml-2">Loading schema...</span>
      </div>
    </div>
  `;

    // Convert schema properties to row data for AG-Grid
    const rowData = convertSchemaToRowData(schema);
    console.log(`Row data for ${type} schema:`, rowData);

    // Define column definitions
    const columnDefs = getSchemaColumnDefs(type);

    // Clear loading indicator before grid initialization
    gridContainer.innerHTML = '';

    // Grid options
    const gridOptions = {
        columnDefs: columnDefs,
        rowData: rowData,
        defaultColDef: {
            minWidth: 100,
            resizable: true,
            sortable: true,
            filter: true,
            tooltipComponent: 'CustomTooltip',
            // Add vertical centering to all cells
            cellStyle: {
                display: 'flex',
                alignItems: 'center'
            }
        },
        animateRows: true,
        // Increase row height to provide more space for content and buttons
        rowHeight: 48,

        // Configure row selection with proper mode
        rowSelection: {
            mode: 'multiRow',
            checkboxes: true,
            headerCheckbox: true
        },

        // Configure the checkbox column with proper spacing
        selectionColumnDef: {
            width: 100,
            minWidth: 100,
            maxWidth: 100,
            pinned: 'left',
            lockPosition: true,
            resizable: false,
            sortable: false,
            suppressHeaderMenuButton: true,
            headerName: 'Select',
            headerClass: 'ag-header-cell-selection',
            cellClass: 'ag-cell-selection',
            // Add right border to clearly separate from next column
            cellStyle: {
                'border-right': '1px solid #E5E7EB',
                'display': 'flex',
                'alignItems': 'center',
                'justifyContent': 'center'
            }
        },

        enableBrowserTooltips: true,
        onGridReady: params => {
            // Store grid API for later use
            if (type === 'target') {
                targetGridApi = params.api;
            } else {
                sourceGridApi = params.api;
            }

            // Size columns to fit
            params.api.sizeColumnsToFit();
        },
        // Handle row styling for flagged rows
        getRowStyle: params => {
            if (params.data.flagged) {
                return {background: 'rgba(239, 68, 68, 0.1)'};
            }
            return null;
        },
        // Add row selection changed listener
        onRowSelected: params => {
            // Update the 'selected' property in the row data
            if (params.node.selected !== undefined) {
                params.node.data.selected = params.node.selected;
            }
        },
        // Prevent default column group ordering and maintain the defined column order
        maintainColumnOrder: true
    };

    // Create the grid
    agGrid.createGrid(gridContainer, gridOptions);
}

/**
 * Convert schema properties to row data for AG-Grid
 */
function convertSchemaToRowData(schema) {
    const rowData = [];

    if (!schema || !schema.properties) {
        console.error("Schema or schema.properties is undefined", schema);
        return rowData;
    }

    try {
        Object.entries(schema.properties).forEach(([key, property]) => {
            rowData.push({
                variable: key,
                selected: false,
                mapped: false,
                flagged: false,
                description: property.description || '',
                dataType: getHumanReadableType(property),
                valueCoding: getValueCoding(property),
                additionalInfo: property,
            });
        });
    } catch (error) {
        console.error("Error converting schema to row data", error);
    }

    console.log(`Converted ${rowData.length} schema properties to row data`);
    return rowData;
}

/**
 * Get human-readable type from schema property
 */
function getHumanReadableType(property) {
    if (!property) return 'Unknown';

    // Handle type as string
    if (typeof property.type === 'string') {
        return capitalizeFirstLetter(property.type);
    }

    // Handle type as array (e.g., ["integer", "null"])
    if (Array.isArray(property.type)) {
        return property.type
            .filter(t => t !== 'null')
            .map(capitalizeFirstLetter)
            .join(' or ');
    }

    // Handle oneOf pattern
    if (property.oneOf && Array.isArray(property.oneOf)) {
        const types = property.oneOf
            .filter(option => option.type !== 'null')
            .map(option => capitalizeFirstLetter(option.type));

        return [...new Set(types)].join(' or ');
    }

    // Handle anyOf pattern
    if (property.anyOf && Array.isArray(property.anyOf)) {
        const types = property.anyOf
            .filter(option => option.type !== 'null')
            .map(option => capitalizeFirstLetter(option.type));

        return [...new Set(types)].join(' or ');
    }

    return 'Complex Type';
}

/**
 * Get value coding from schema property
 */
function getValueCoding(property) {
    if (!property || !property.enum || !Array.isArray(property.enum)) {
        return '';
    }

    // If there's no enum, there's no value coding
    if (!property.enum.length) return '';

    // Format enum values with descriptions if available
    const hasEnumDescriptions = property.enumDescriptions &&
        Array.isArray(property.enumDescriptions) &&
        property.enumDescriptions.length > 0;

    if (hasEnumDescriptions) {
        return property.enum.map((val, index) => {
            const description = index < property.enumDescriptions.length
                ? property.enumDescriptions[index]
                : '';
            return `${val !== null ? val : 'null'}: ${description}`;
        }).join('\n');
    } else {
        // Just list the enum values if no descriptions
        return property.enum.map(val => val !== null ? val : 'null').join(', ');
    }
}

/**
 * Define column definitions for the schema grid
 */
function getSchemaColumnDefs(type) {
    return [
        // Map column - will appear after the selection checkboxes
        {
            headerName: 'Map',
            field: 'mapped',
            width: 80,
            minWidth: 80,
            maxWidth: 80,
            pinned: 'left',
            lockPosition: true,
            suppressHeaderMenuButton: true,
            cellRenderer: params => {
                return `<input type="checkbox" 
                       class="focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300 rounded" 
                       ${params.value ? 'checked' : ''} 
                       data-action="map" 
                       data-variable="${params.data.variable}" 
                       data-schema-type="${type}">`;
            },
            onCellClicked: params => {
                // Handle checkbox click
                if (params.event.target.tagName === 'INPUT') {
                    params.data.mapped = params.event.target.checked;
                }
            },
            // Add right border to clearly separate from Variable Name
            cellStyle: {
                'border-right': '1px solid #E5E7EB',
                'display': 'flex',
                'alignItems': 'center',
                'justifyContent': 'center'
            }
        },
        {
            headerName: 'Variable Name',
            field: 'variable',
            width: 150,
            minWidth: 120,
            pinned: 'left',
            lockPosition: true,
            cellStyle: {
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
            }
        },
        {
            headerName: 'Description',
            field: 'description',
            width: 200,
            minWidth: 150,
            wrapText: true,
            autoHeight: true,
            cellStyle: {
                lineHeight: '1.2',
                display: 'flex',
                alignItems: 'center'
            }
        },
        {
            headerName: 'Data Type',
            field: 'dataType',
            width: 120,
            minWidth: 100,
            tooltipField: 'dataType'
        },
        {
            headerName: 'Value Coding',
            field: 'valueCoding',
            width: 200,
            minWidth: 150,
            wrapText: true,
            autoHeight: true,
            cellRenderer: params => {
                if (!params.value) return '';

                const items = params.value.split('\n').map(item =>
                    `<div class="enum-item">${item}</div>`
                ).join('');

                return `<div class="value-coding-content">${items}</div>`;
            },
            tooltipValueGetter: params => {
                return params.value;
            }
        },
        {
            headerName: 'Additional Information',
            field: 'additionalInfo',
            width: 150,
            minWidth: 120,
            // Add valueFormatter for object data type
            valueFormatter: params => {
                return params.value ? 'View Details' : '';
            },
            cellRenderer: params => {
                // We'll need a custom renderer for the "Details" button
                if (!params.value) return '';

                return `<button class="cursor-pointer text-amber-600 hover:text-amber-800 px-3 py-2 m-1 rounded border border-amber-300 hover:border-amber-400 text-sm">
                  View Details
                </button>`;
            },
            onCellClicked: params => {
                if (params.value) {
                    // Show a popup or modal with property details
                    showPropertyDetails(params.data.variable, params.value);
                }
            }
        }
    ];
}

/**
 * Helper function to capitalize the first letter of a string
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
}

/**
 * Display property details in a modal/popup
 */
function showPropertyDetails(variable, property) {
    // Get the trigger element (the button that was clicked)
    const triggerEvent = window.event;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Determine position (centered by default)
    let posX = viewportWidth / 2;
    let posY = viewportHeight / 2;

    // If we have event information, position near the click
    if (triggerEvent && triggerEvent.clientX && triggerEvent.clientY) {
        posX = triggerEvent.clientX;
        posY = triggerEvent.clientY;
    }

    // Create modal element
    const modal = document.createElement('div');
    modal.id = 'property-details-modal';
    modal.className = 'fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200';
    modal.style.maxWidth = '600px';
    modal.style.width = 'calc(100% - 40px)';
    modal.style.maxHeight = '80vh';
    modal.style.overflowY = 'auto';

    // Format JSON with proper indentation
    const jsonString = JSON.stringify(property, null, 2);

    // Modal content HTML
    modal.innerHTML = `
    <div class="flex justify-between items-start p-6 pb-3">
      <h3 class="text-lg font-bold text-gray-900">${variable} Details</h3>
      <button id="close-property-modal" class="text-gray-400 hover:text-gray-500">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div class="px-6 pb-3">
      <div class="bg-gray-50 p-4 rounded-md overflow-auto">
        <pre class="text-sm">${jsonString}</pre>
      </div>
    </div>
    <div class="p-6 pt-3 flex justify-end">
      <button id="close-property-btn" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
        Close
      </button>
    </div>
  `;

    // Add modal to the document
    document.body.appendChild(modal);

    // Position the modal
    const modalRect = modal.getBoundingClientRect();

    // Adjust position to ensure it stays within viewport
    let finalX = Math.min(posX, viewportWidth - modalRect.width - 20);
    finalX = Math.max(finalX, 20); // Keep at least 20px from the left edge

    let finalY = posY - 30; // Position slightly above click point

    // If modal would appear below the bottom edge, position it above the click point
    if (finalY + modalRect.height > viewportHeight - 20) {
        finalY = Math.max(20, viewportHeight - modalRect.height - 20);
    }

    modal.style.left = `${finalX}px`;
    modal.style.top = `${finalY}px`;

    // Create invisible full-screen overlay for detecting clicks outside modal
    const overlay = document.createElement('div');
    overlay.id = 'modal-click-overlay';
    overlay.className = 'fixed inset-0 z-40';
    document.body.appendChild(overlay);

    // Close modal when close button is clicked
    document.getElementById('close-property-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
        document.body.removeChild(overlay);
    });

    document.getElementById('close-property-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
        document.body.removeChild(overlay);
    });

    // Close modal when clicking outside
    overlay.addEventListener('click', () => {
        document.body.removeChild(modal);
        document.body.removeChild(overlay);
    });
}

/**
 * Handle responsive grid sizing
 */
function handleResponsiveGridSizing() {
    // Resize grids when window is resized
    window.addEventListener('resize', () => {
        if (targetGridApi) targetGridApi.sizeColumnsToFit();
        if (sourceGridApi) sourceGridApi.sizeColumnsToFit();
    });

    // Make sure to call sizeColumnsToFit after tab changes too
    const tabLinks = document.querySelectorAll('.tab-link[data-tabname="Vocabulary Mapper"]');
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            setTimeout(() => {
                if (targetGridApi) targetGridApi.sizeColumnsToFit();
                if (sourceGridApi) sourceGridApi.sizeColumnsToFit();
            }, 50);
        });
    });

    // For mobile dropdown
    const navSelect = document.getElementById('nav-select');
    if (navSelect) {
        navSelect.addEventListener('change', (event) => {
            if (event.target.value === 'Vocabulary Mapper') {
                setTimeout(() => {
                    if (targetGridApi) targetGridApi.sizeColumnsToFit();
                    if (sourceGridApi) sourceGridApi.sizeColumnsToFit();
                }, 50);
            }
        });
    }
}

/**
 * Set up the action buttons
 */
function setupButtons() {
    const flagBtn = document.getElementById('flag-btn');
    const askLlmBtn = document.getElementById('ask-llm-btn');
    const mapBtn = document.getElementById('map-btn');
    const clearBtn = document.getElementById('clear-btn');

    if (flagBtn) {
        flagBtn.addEventListener('click', () => {
            const selectedTargetRows = getSelectedRows('target');
            const selectedSourceRows = getSelectedRows('source');

            if (selectedTargetRows.length === 0 && selectedSourceRows.length === 0) {
                alert('Please select at least one variable to flag.');
                return;
            }

            // Flag selected rows
            flagSelectedRows(selectedTargetRows, 'target');
            flagSelectedRows(selectedSourceRows, 'source');

            // Add message to chat
            const message = `Flagged variables: 
        ${selectedTargetRows.length > 0 ? 'Target: ' + selectedTargetRows.map(row => row.variable).join(', ') : ''}
        ${selectedSourceRows.length > 0 ? 'Source: ' + selectedSourceRows.map(row => row.variable).join(', ') : ''}`;

            addMessageToChat('system', message);
        });
    }

    if (askLlmBtn) {
        askLlmBtn.addEventListener('click', () => {
            const selectedTargetRows = getSelectedRows('target');
            const selectedSourceRows = getSelectedRows('source');

            if (selectedTargetRows.length === 0 && selectedSourceRows.length === 0) {
                alert('Please select at least one variable to ask about.');
                return;
            }

            // Generate a question for the LLM
            let question = 'I need help understanding ';

            if (selectedTargetRows.length > 0) {
                question += `the target variables: ${selectedTargetRows.map(row => row.variable).join(', ')}`;

                if (selectedSourceRows.length > 0) {
                    question += ' and their potential mapping to ';
                }
            }

            if (selectedSourceRows.length > 0) {
                if (selectedTargetRows.length === 0) {
                    question += 'the source variables: ';
                }
                question += `${selectedSourceRows.map(row => row.variable).join(', ')}`;
            }

            // Add message to chat
            addMessageToChat('user', question);
            simulateAssistantResponse();
        });
    }

    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            const selectedTargetRows = getSelectedRows('target');
            const selectedSourceRows = getSelectedRows('source');

            if (selectedTargetRows.length === 0 || selectedSourceRows.length === 0) {
                alert('Please select at least one variable from both target and source schemas to map.');
                return;
            }

            // Set mapped flag for selected rows
            setMappedFlags(selectedTargetRows, 'target');
            setMappedFlags(selectedSourceRows, 'source');

            // Add message to chat
            const message = `Mapped ${selectedTargetRows.map(row => row.variable).join(', ')} to ${selectedSourceRows.map(row => row.variable).join(', ')}`;
            addMessageToChat('system', message);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // Clear selections in both grids
            clearSelections('target');
            clearSelections('source');
            // Clear flags
            clearFlags();

            addMessageToChat('system', 'All selections and flags cleared.');
        });
    }
}

/**
 * Get selected rows from a grid
 */
function getSelectedRows(type) {
    const gridApi = type === 'target' ? targetGridApi : sourceGridApi;
    if (!gridApi) return [];

    return gridApi.getSelectedRows();
}

/**
 * Flag selected rows
 */
function flagSelectedRows(rows, type) {
    const gridApi = type === 'target' ? targetGridApi : sourceGridApi;
    if (!gridApi) return;

    rows.forEach(row => {
        row.flagged = true;
    });

    gridApi.refreshCells({force: true});
}

/**
 * Set mapped flags for selected rows
 */
function setMappedFlags(rows, type) {
    const gridApi = type === 'target' ? targetGridApi : sourceGridApi;
    if (!gridApi) return;

    rows.forEach(row => {
        row.mapped = true;
    });

    gridApi.refreshCells({force: true});
}

/**
 * Clear selections
 */
function clearSelections(type) {
    const gridApi = type === 'target' ? targetGridApi : sourceGridApi;
    if (!gridApi) return;

    gridApi.deselectAll();
}

/**
 * Clear flags
 */
function clearFlags() {
    ['target', 'source'].forEach(type => {
        const gridApi = type === 'target' ? targetGridApi : sourceGridApi;
        if (!gridApi) return;

        gridApi.forEachNode(node => {
            if (node.data.flagged) {
                node.data.flagged = false;
                if (node.data.mapped) {
                    node.data.mapped = false;
                }
            }
        });

        gridApi.refreshCells({force: true});
    });
}

/**
 * Set up the chat interface
 */
function setupChatInterface() {
    const fileInput = document.getElementById('vm-chat-file-upload');
    const filesList = document.getElementById('vm-attached-files-list');
    const chatInput = document.getElementById('vm-chat-input');
    const sendButton = document.getElementById('vm-chat-send-btn');
    const messagesContainer = document.getElementById('vm-chat-messages');

    // Handle file uploads
    if (fileInput && filesList) {
        fileInput.addEventListener('change', () => {
            filesList.innerHTML = '';
            if (fileInput.files.length === 0) return;

            Array.from(fileInput.files).forEach(file => {
                const fileChip = document.createElement('div');
                fileChip.className = 'bg-gray-200 text-gray-800 px-2 py-1 rounded-md text-sm flex items-center';

                const fileName = document.createElement('span');
                fileName.className = 'mr-2 truncate max-w-[150px]';
                fileName.textContent = file.name;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'text-gray-500 hover:text-gray-700';
                removeBtn.innerHTML = '&times;';
                removeBtn.addEventListener('click', () => fileChip.remove());

                fileChip.appendChild(fileName);
                fileChip.appendChild(removeBtn);
                filesList.appendChild(fileChip);
            });
        });
    }

    // Handle sending messages
    function sendMessage() {
        if (!chatInput || !messagesContainer) return;

        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        addMessageToChat('user', message);

        // Clear input
        chatInput.value = '';

        // Simulate assistant response
        simulateAssistantResponse();
    }

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

/**
 * Add a message to the chat
 */
function addMessageToChat(role, content) {
    const messagesContainer = document.getElementById('vm-chat-messages');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');

    if (role === 'user') {
        messageElement.className = 'bg-amber-50 rounded-lg p-3 mb-3 ml-auto max-w-2xl';
    } else if (role === 'assistant') {
        messageElement.className = 'bg-gray-100 rounded-lg p-3 mb-3 max-w-2xl';
    } else if (role === 'system') {
        messageElement.className = 'bg-blue-50 rounded-lg p-3 mb-3 mx-auto max-w-2xl text-sm text-gray-600';
    }

    messageElement.textContent = content;
    messagesContainer.appendChild(messageElement);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Simulate assistant response with intelligent insights based on schemas
 */
function simulateAssistantResponse() {
    const messagesContainer = document.getElementById('vm-chat-messages');
    if (!messagesContainer) return;

    // Add loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.className = 'bg-gray-100 rounded-lg p-3 mb-3 max-w-2xl flex items-center';
    loadingElement.innerHTML = '<span class="inline-block w-3 h-3 mr-2 bg-gray-500 rounded-full animate-pulse"></span>' +
        '<span class="inline-block w-3 h-3 mx-1 bg-gray-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></span>' +
        '<span class="inline-block w-3 h-3 ml-1 bg-gray-500 rounded-full animate-pulse" style="animation-delay: 0.4s"></span>';
    messagesContainer.appendChild(loadingElement);

    // Get selected variables
    const selectedTargetRows = getSelectedRows('target');
    const selectedSourceRows = getSelectedRows('source');

    // Simulate response delay
    setTimeout(() => {
        // Remove loading indicator
        messagesContainer.removeChild(loadingElement);

        // Generate contextual response based on selections
        let response = '';

        if (selectedTargetRows.length > 0 && selectedSourceRows.length > 0) {
            // Both target and source variables selected - provide mapping insights
            response = generateMappingInsights(selectedTargetRows, selectedSourceRows);
        } else if (selectedTargetRows.length > 0) {
            // Only target variables selected - provide target variable insights
            response = generateTargetInsights(selectedTargetRows);
        } else if (selectedSourceRows.length > 0) {
            // Only source variables selected - provide source variable insights
            response = generateSourceInsights(selectedSourceRows);
        } else {
            // Generic response if no selections (shouldn't happen due to button validation)
            response = "I can help you map variables between schemas. Please select variables from either the target or source schema, or both, and I'll provide insights on potential mappings.";
        }

        // Add assistant response
        addMessageToChat('assistant', response);
    }, 1500);
}

/**
 * Generate insights for mapping between target and source variables
 */
function generateMappingInsights(targetRows, sourceRows) {
    // Find potential mappings based on similarities
    const insights = [];

    for (const targetRow of targetRows) {
        const targetType = targetRow.dataType;
        const targetName = targetRow.variable;
        const targetDesc = targetRow.description;

        // Find candidate source variables with similar type or name/description
        const candidates = sourceRows.filter(sourceRow => {
            const sourceType = sourceRow.dataType;
            const sourceName = sourceRow.variable;
            const sourceDesc = sourceRow.description;

            // Check for type compatibility
            const typeMatch = sourceType.includes(targetType) || targetType.includes(sourceType);

            // Check for name similarity (case insensitive substring match)
            const nameMatch = sourceName.toLowerCase().includes(targetName.toLowerCase()) ||
                targetName.toLowerCase().includes(sourceName.toLowerCase());

            // Check for description similarity (keywords match)
            const descMatch = (sourceDesc && targetDesc) &&
                (sourceDesc.toLowerCase().includes(targetDesc.toLowerCase()) ||
                    targetDesc.toLowerCase().includes(sourceDesc.toLowerCase()));

            return typeMatch || nameMatch || descMatch;
        });

        if (candidates.length > 0) {
            // Sort candidates by match strength (simplified)
            insights.push({
                target: targetRow,
                sources: candidates
            });
        } else {
            insights.push({
                target: targetRow,
                sources: []
            });
        }
    }

    // Generate response text
    let response = '';

    if (insights.length > 0) {
        response = "Based on the schemas, here are my suggested mappings:\n\n";

        for (const insight of insights) {
            const targetVar = insight.target.variable;

            if (insight.sources.length > 0) {
                // List potential mappings with confidence
                response += `• For ${targetVar} (${insight.target.dataType}), consider mapping to:\n`;

                insight.sources.forEach(source => {
                    response += `  - ${source.variable} (${source.dataType}): ${source.description}\n`;
                });

                // Add transformation advice if needed
                if (insight.target.dataType !== insight.sources[0].dataType) {
                    response += `  Note: You may need to transform the data type from ${insight.sources[0].dataType} to ${insight.target.dataType}.\n`;
                }
            } else {
                response += `• For ${targetVar}, I couldn't find any strong matches in the selected source variables.\n`;
            }

            response += '\n';
        }

        response += "Would you like me to provide more detailed information about any specific mapping?";
    } else {
        response = "I analyzed the selected variables but couldn't find clear mapping candidates. Consider selecting variables with similar data types or descriptions.";
    }

    return response;
}

/**
 * Generate insights for target variables only
 */
function generateTargetInsights(targetRows) {
    // Get the source data schema
    const sourceVars = [];
    if (sourceGridApi) {
        sourceGridApi.forEachNode(node => {
            sourceVars.push(node.data);
        });
    }

    let response = "I've analyzed the selected target variables:\n\n";

    for (const row of targetRows) {
        response += `• ${row.variable} (${row.dataType}): ${row.description}\n`;

        // Add value coding info if available
        if (row.valueCoding) {
            response += `  Values: ${row.valueCoding.split('\n').join(', ')}\n`;
        }

        // Suggest potential source variables
        const suggestedSources = sourceVars.filter(sourceVar => {
            // Simple name-based matching (could be improved)
            return sourceVar.variable.toLowerCase().includes(row.variable.toLowerCase()) ||
                row.variable.toLowerCase().includes(sourceVar.variable.toLowerCase()) ||
                (sourceVar.description && row.description &&
                    (sourceVar.description.toLowerCase().includes(row.description.toLowerCase()) ||
                        row.description.toLowerCase().includes(sourceVar.description.toLowerCase())));
        });

        if (suggestedSources.length > 0) {
            response += `  Potential source variables: ${suggestedSources.map(s => s.variable).join(', ')}\n`;
        }

        response += '\n';
    }

    response += "Would you like to select some source variables to create a mapping?";

    return response;
}

/**
 * Generate insights for source variables only
 */
function generateSourceInsights(sourceRows) {
    // Get the target data schema
    const targetVars = [];
    if (targetGridApi) {
        targetGridApi.forEachNode(node => {
            targetVars.push(node.data);
        });
    }

    let response = "I've analyzed the selected source variables:\n\n";

    for (const row of sourceRows) {
        response += `• ${row.variable} (${row.dataType}): ${row.description}\n`;

        // Add value coding info if available
        if (row.valueCoding) {
            response += `  Values: ${row.valueCoding.split('\n').join(', ')}\n`;
        }

        // Suggest potential target variables
        const suggestedTargets = targetVars.filter(targetVar => {
            // Simple name-based matching (could be improved)
            return targetVar.variable.toLowerCase().includes(row.variable.toLowerCase()) ||
                row.variable.toLowerCase().includes(targetVar.variable.toLowerCase()) ||
                (targetVar.description && row.description &&
                    (targetVar.description.toLowerCase().includes(row.description.toLowerCase()) ||
                        row.description.toLowerCase().includes(targetVar.description.toLowerCase())));
        });

        if (suggestedTargets.length > 0) {
            response += `  Potential target variables: ${suggestedTargets.map(t => t.variable).join(', ')}\n`;
        }

        response += '\n';
    }

    response += "Would you like to select some target variables to create a mapping?";

    return response;
}

export {initVocabularyMapperApp};