# epiHarmony

A client-side web application for LLM-assisted epidemiological data harmonization.

## Overview

epiHarmony guides users through a comprehensive three-step data harmonization workflow:

1. **Vocabulary Mapping** - Map concepts between source and target schemas with AI assistance
2. **Data Transformation** - Generate and apply transformation code to harmonize data
3. **Quality Control** - Validate transformed data against target schemas

The entire application runs in the browser with no server-side components, making it secure and privacy-preserving for sensitive epidemiological data.

## Features

- 🤖 **AI-Powered Mapping** - Leverages Google's Gemini AI for intelligent concept mapping
- 📊 **Visual Schema Explorer** - Interactive data dictionaries for source and target schemas
- 💻 **Code Generation** - Automatic transformation code generation in JavaScript or R
- ✅ **Comprehensive Validation** - Schema-based validation with detailed error reporting
- 💾 **Blueprint System** - Save and share complete harmonization projects as JSON files
- 🔒 **Privacy-First** - All processing happens locally in your browser
- 📱 **Responsive Design** - Works on desktop and tablet devices

## Technology Stack

- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Data Grid**: AG-Grid Community
- **AI/LLM**: Google Generative AI (Gemini)
- **Vector Database**: @babycommando/entity-db
- **Schema Validation**: Ajv.js
- **Code Editor**: CodeMirror
- **R Runtime**: WebR
- **Storage**: IndexedDB

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/epiverse/epiharmony.git
   cd epiharmony
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

### Production Build

To build for production:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

## Usage

### 1. Configuration

- **Blueprint File**: Create a new project or load an existing blueprint
- **Schemas**: Load source and target JSON schemas from URLs
- **Data**: Optionally upload source data (CSV, TSV, or JSON)
- **AI Setup**: Enter your Gemini API key and select models

### 2. Vocabulary Mapping

- Review AI-suggested mappings between concepts
- Create manual mappings using the search interface
- Accept, reject, or flag mappings for review
- Use the chat interface for AI assistance

### 3. Data Transformation

- Select a mapping to transform
- Generate transformation code with AI assistance
- Edit and test code in the integrated editor
- Apply transformations to your data

### 4. Quality Control

- Validate transformed data against the target schema
- Review detailed error reports
- Export validation results as CSV
- Browse the target schema dictionary

## Blueprint File Format

Blueprint files capture the complete state of a harmonization project:

```json
{
  "version": "1.0",
  "schemas": {
    "source": { "urls": [...], "mainSchemaIndex": 0 },
    "target": { "urls": [...], "mainSchemaIndex": 0 }
  },
  "mappings": [...],
  "aiConfig": {
    "embeddingModel": "text-embedding-004",
    "chatModel": "gemini-1.5-flash"
  }
}
```

## Development

### Project Structure

```
src/
├── components/     # UI components
├── core/          # Core functionality
├── tabs/          # Tab implementations
├── utils/         # Utility functions
├── workers/       # Web Workers
└── lib/          # External integrations
```

### Key Components

- **StorageManager**: Handles IndexedDB operations
- **VocabularyMapper**: Manages concept mapping workflow
- **DataTransform**: Code generation and execution
- **QualityControl**: Validation and error reporting

## Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the main branch.

Manual deployment:
```bash
npm run deploy
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Generative AI for providing the Gemini API
- The epidemiology community for inspiration and feedback
- All open-source contributors

## Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/epiverse/epiharmony/issues)
- Contact the maintainers

## Roadmap

See [PLAN.md](PLAN.md) for the detailed development roadmap and upcoming features.

## Citation

If you use epiHarmony in your research, please cite:
```
epiHarmony: LLM-Assisted Epidemiological Data Harmonization
https://github.com/epiverse/epiharmony
```