# PrepTalk: Newspaper Analysis Focus - Feature Blueprints

This document outlines the implementation plan for each "Analysis Focus" option in the Newspaper Analysis tool. Each focus area will be treated as a specialized "agent" with a distinct persona, task, and a structured JSON output schema.

This modular approach ensures maintainability and allows for targeted quality improvements for each feature.

---

### 1. Mains Analysis (Arguments, Keywords, Viewpoints)

*   **Objective**: To deconstruct an article into components directly usable for Mains answer writing.
*   **AI Persona**: Act as an experienced political analyst and editor for a civil services magazine.
*   **AI Task**: Read the article and extract the core arguments, potential counter-arguments, essential keywords for answer writing, and any notable viewpoints or quoted opinions from individuals or organizations.
*   **Output Schema (`MainsAnalysisSchema`)**:
    ```json
    {
      "keyArguments": [
        { "argument": "The core point being made.", "supportingEvidence": "Evidence from the text." }
      ],
      "counterArguments": [
        { "argument": "The counter-point or alternative view.", "supportingEvidence": "Evidence from the text." }
      ],
      "keywordsForMains": ["Cooperative Federalism", "Fiscal Policy", "Geopolitical Tensions"],
      "notableViewpoints": [
        { "source": "Finance Minister", "viewpoint": "A direct or summarized quote of their opinion." }
      ]
    }
    ```

---

### 2. Prelims Fact Finder (Key Names, Dates, Schemes)

*   **Objective**: To extract discrete, objective facts from an article that are highly relevant for Prelims.
*   **AI Persona**: Act as a diligent researcher and fact-checker preparing a "fact sheet" for an exam aspirant.
*   **AI Task**: Scan the article to identify and categorize all important entities. This includes names of people, organizations, locations, government schemes/policies, specific dates, and key statistics.
*   **Output Schema (`FactFinderSchema`)**:
    ```json
    {
      "keyPeople": [ { "name": "N. K. Singh", "context": "Chairman of the 15th Finance Commission." } ],
      "keyOrganizations": [ { "name": "Reserve Bank of India (RBI)", "context": "Mentioned in relation to monetary policy." } ],
      "keyLocations": [ { "name": "New Delhi", "context": "Location of the G20 summit." } ],
      "keySchemes": [ { "name": "PM-KISAN", "context": "Cited as an example of a direct benefit transfer scheme." } ],
      "keyDates": [ { "date": "August 15, 1947", "context": "India's Independence Day." } ],
      "keyStats": [ { "stat": "7.2%", "context": "India's projected GDP growth for the fiscal year." } ]
    }
    ```

---

### 3. Critical Analysis (Tone, Bias, Fact vs. Opinion)

*   **Objective**: To teach the user how to read critically by analyzing the article's subtext, biases, and logical structure.
*   **AI Persona**: Act as a media literacy professor and logician.
*   **AI Task**: Evaluate the article's overall tone (e.g., neutral, biased, analytical, alarmist). Identify potential authorial biases. Extract and separate examples of factual statements vs. opinionated statements. Assess the logical consistency of the arguments presented.
*   **Output Schema (`CriticalAnalysisSchema`)**:
    ```json
    {
      "toneAnalysis": { "tone": "Largely Analytical", "justification": "The article uses neutral language and cites data..." },
      "biasAnalysis": { "potentialBias": "Confirmation Bias", "justification": "The author may be focusing on data that supports their pre-existing conclusion..." },
      "factVsOpinion": {
        "factualStatements": ["The RBI raised the repo rate by 25 basis points."],
        "opinionStatements": ["This was a much-needed move to curb inflation."]
      },
      "logicalConsistency": { "assessment": "Largely Consistent", "justification": "The conclusion logically follows from the premises presented..." }
    }
    ```

---

### 4. Vocabulary Builder for Editorials

*   **Objective**: To help users improve their English vocabulary, especially with words commonly found in editorials.
*   **AI Persona**: Act as a lexicographer and GRE/CAT verbal section expert.
*   **AI Task**: Identify 5-10 advanced or contextually important vocabulary words from the article. For each word, provide a clear definition, part of speech, a synonym, an antonym, and the exact sentence from the article where it was used.
*   **Output Schema (`VocabularyBuilderSchema`)**:
    ```json
    {
      "vocabulary": [
        {
          "word": "Obfuscate",
          "definition": "To make something obscure, unclear, or unintelligible.",
          "partOfSpeech": "Verb",
          "synonym": "Conceal",
          "antonym": "Clarify",
          "contextSentence": "The report seemed designed to obfuscate the real issues at hand."
        }
      ]
    }
    ```

---

### 5. Comprehensive Summary

*   **Objective**: To provide a detailed, structured summary that goes beyond the basic 2-3 sentence overview.
*   **AI Persona**: Act as a professional summarizer for a research institution.
*   **AI Task**: Create a multi-paragraph summary covering the core issue, its background, the key stakeholders involved, the main arguments presented, and the article's conclusion or outlook.
*   **Output Schema (`ComprehensiveSummarySchema`)**:
    ```json
    {
      "detailedSummary": "A multi-paragraph string containing the full, detailed summary with markdown for formatting."
    }
    ```
