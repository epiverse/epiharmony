# epiHarmony Implementation Plan

## Project Overview
epiHarmony is a client-side web application for LLM-assisted epidemiological data harmonization. It guides users through a three-step workflow: vocabulary mapping, data transformation, and quality control.

## Current Status
**Last Updated**: September 24, 2025
**Phase Completed**: Core Systems & Quality Control
**Next Phase**: Vocabulary Mapper RAG Implementation

## Technology Stack (Actual Versions)
- **Build Tool**: Vite 7.1.7 ✅
- **Styling**: Tailwind CSS 3.4.17 ✅
- **Data Grid**: AG-Grid Community 34.2.0 ✅
- **AI/LLM**: @google/genai 1.20.0 ✅
- **Vector DB**: @babycommando/entity-db 1.0.11 ✅
- **Validation**: Ajv.js 8.17.1 ✅
- **Code Editor**: CodeMirror 6.0.2 ✅
- **R Runtime**: webr 0.5.5 ✅
- **Storage**: idb 8.0.3 ✅

## Development Phases

### Phase 1: Foundation & Project Setup (Sprint 1) ✅ COMPLETED
**Goal**: Establish project infrastructure and development environment
**Status**: Completed on September 24, 2025

#### Tasks:
1. **Project Initialization**
   - [x] Create PLAN.md documentation
   - [x] Initialize Vite project with proper configuration
   - [x] Set up package.json with all dependencies
   - [x] Configure .gitignore for Node.js project
   - [x] Create README.md with project overview

2. **Build Configuration**
   - [x] Configure Vite for production build
   - [x] Set up Tailwind CSS with Amber color theme
   - [x] Configure PostCSS for Tailwind processing
   - [x] Set up development server with hot reload
   - [x] Configure static asset handling

3. **Directory Structure**
   - [x] Create src/ directory hierarchy
   - [x] Set up public/ directory for static assets
   - [x] Organize assets/logo/ files
   - [x] Create placeholder files for all modules

### Phase 2: UI Framework & Layout (Sprint 2) ✅ COMPLETED
**Goal**: Build the foundational UI components and layout structure
**Status**: Completed on September 24, 2025

#### Tasks:
1. **Base Layout**
   - [x] Create index.html with semantic structure
   - [x] Implement responsive grid layout
   - [x] Add Google Fonts (Dancing Script)
   - [x] Set up favicon with epiharmony-logo-bg.svg

2. **Header Component**
   - [x] Create static header with amber-900 background
   - [x] Add epiHarmony logo and branding
   - [x] Implement GitHub repository link
   - [x] Apply Dancing Script font to app name

3. **Data Panel Component**
   - [x] Build collapsible panel mechanism
   - [x] Add smooth transition animations
   - [x] Create form layout for all inputs
   - [x] Implement show/hide toggle button

4. **Workspace Container**
   - [x] Create tab navigation system
   - [x] Add tab switching logic
   - [x] Style active/inactive tab states
   - [x] Add tab icons from assets

### Phase 3: Core Systems (Sprint 3) ✅ COMPLETED
**Goal**: Implement fundamental application systems
**Status**: Completed on September 24, 2025

#### Tasks:
1. **State Management**
   - [x] Design state architecture
   - [x] Implement blueprint state manager
   - [x] Create event system for state changes
   - [x] Add state persistence logic

2. **Storage Layer**
   - [x] Set up IndexedDB with idb wrapper
   - [x] Create database schema
   - [x] Implement CRUD operations
   - [x] Add data migration system

3. **Blueprint System**
   - [x] Define blueprint JSON schema
   - [x] Implement blueprint serialization
   - [x] Create import/export functions
   - [x] Add URL parameter handling

4. **Schema Management**
   - [x] Create schema loader with SchemaProcessor
   - [x] Implement schema validation
   - [x] Add schema parsing utilities
   - [x] Build reference resolution system
   - [x] Support multi-schema loading with main schema selection

### Phase 4: Data Panel Implementation (Sprint 4) ✅ COMPLETED
**Goal**: Complete the configuration panel functionality
**Status**: Completed on September 24, 2025

#### Tasks:
1. **Blueprint File Management**
   - [x] Implement "Create New" functionality
   - [x] Add file upload handler
   - [x] Create URL loader with validation
   - [x] Update browser URL on load
   - [x] Add "Clear Project" button

2. **Schema Loaders**
   - [x] Build source schema input UI
   - [x] Create target schema input UI
   - [x] Implement multi-URL support
   - [x] Add main schema selection
   - [x] Create validation feedback

3. **Data Upload**
   - [x] Implement file input for CSV/TSV/JSON
   - [x] Create data parser
   - [x] Add data preview in tabs
   - [x] Store data in memory and IndexedDB

4. **AI Configuration**
   - [x] Create Gemini API key input
   - [x] Implement key validation
   - [x] Build model selection dropdowns with dynamic API listing
   - [x] Add embedding dimension controls (128-3072)
   - [x] Create "Forget API Key" function
   - [x] Add test buttons for embedding and chat

### Phase 5: Vocabulary Mapper - Core (Sprint 5)
**Goal**: Build the foundation of the vocabulary mapping system

#### Tasks:
1. **Schema Visualization**
   - [ ] Integrate AG-Grid for schema display
   - [ ] Create data dictionary formatter
   - [ ] Implement search functionality
   - [ ] Add row highlighting system

2. **Vector Database Setup**
   - [ ] Integrate EntityDB library
   - [ ] Create embedding generator
   - [ ] Implement batch processing
   - [ ] Build ANN index system

3. **WebWorker Infrastructure**
   - [ ] Set up embedding worker
   - [ ] Implement worker communication
   - [ ] Add progress reporting
   - [ ] Create error handling

4. **RAG System Core**
   - [ ] Implement concept embedding
   - [ ] Create semantic search
   - [ ] Build bipartite graph generator
   - [ ] Add neighbor retrieval logic

### Phase 6: Vocabulary Mapper - UI (Sprint 6)
**Goal**: Complete the vocabulary mapper user interface

#### Tasks:
1. **Mapping Workbench**
   - [ ] Create mapping navigator
   - [ ] Implement Previous/Next buttons
   - [ ] Add mapping counter display
   - [ ] Build action buttons (Accept/Reject/Flag)

2. **Manual Mapping Tools**
   - [ ] Create concept search bars
   - [ ] Build selection lists
   - [ ] Implement drag-and-drop
   - [ ] Add "Create Manual Mapping" button

3. **Chat Interface**
   - [ ] Integrate Gemini chat API
   - [ ] Create chat UI component
   - [ ] Add system prompt editor
   - [ ] Implement floating chat icon
   - [ ] Build file attachment system

4. **Mapping Automation**
   - [ ] Create full-automation mode
   - [ ] Add interrupt mechanism
   - [ ] Implement batch processing
   - [ ] Build progress indicator

### Phase 7: Data Transform Implementation (Sprint 7)
**Goal**: Build the code generation and transformation system

#### Tasks:
1. **CodeMirror Integration**
   - [ ] Set up CodeMirror editor
   - [ ] Configure JavaScript syntax
   - [ ] Configure R syntax
   - [ ] Add idea theme
   - [ ] Implement autocompletion

2. **WebR Integration**
   - [ ] Set up WebR in WebWorker
   - [ ] Create R runtime environment
   - [ ] Implement code execution
   - [ ] Add output streaming

3. **Transform UI**
   - [ ] Create mapping selector dropdown
   - [ ] Build console output panel
   - [ ] Add data preview grid
   - [ ] Implement pop-out editor

4. **Code Generation**
   - [ ] Connect to Gemini API
   - [ ] Create prompt templates
   - [ ] Implement code insertion
   - [ ] Add collaborative editing
   - [ ] Build Apply/Reset logic

### Phase 8: Quality Control Implementation (Sprint 8) ✅ COMPLETED
**Goal**: Create the validation and quality control system
**Status**: Completed on September 24, 2025

#### Tasks:
1. **Validation Engine**
   - [x] Integrate Ajv.js library
   - [x] Create validation processor
   - [x] Build error aggregator
   - [x] Implement row-level validation

2. **Data Validation Tab**
   - [x] Create AG-Grid with error highlighting
   - [x] Add status column with icons
   - [x] Build error tooltips
   - [x] Implement error filtering

3. **Error Summary Panel**
   - [x] Create error grouping logic
   - [x] Build interactive error list
   - [x] Add click-to-filter functionality
   - [x] Implement export to CSV

4. **Schema Dictionary Tab**
   - [x] Create schema viewer
   - [x] Add search functionality
   - [x] Implement variable highlighting
   - [x] Build cross-tab navigation

### Phase 9: Integration & Polish (Sprint 9)
**Goal**: Connect all components and refine user experience

#### Tasks:
1. **Component Integration**
   - [ ] Wire up all three tabs
   - [ ] Implement state synchronization
   - [ ] Add data flow between tabs
   - [ ] Create progress tracking

2. **Performance Optimization**
   - [ ] Optimize WebWorker usage
   - [ ] Implement lazy loading
   - [ ] Add request debouncing
   - [ ] Create loading states

3. **Error Handling**
   - [ ] Add global error handler
   - [ ] Create user notifications
   - [ ] Implement recovery mechanisms
   - [ ] Add validation messages

4. **UX Refinements**
   - [ ] Add keyboard shortcuts
   - [ ] Implement undo/redo
   - [ ] Create help tooltips
   - [ ] Add confirmation dialogs

### Phase 10: Testing & Documentation (Sprint 10)
**Goal**: Ensure quality and provide comprehensive documentation

#### Tasks:
1. **Testing Suite**
   - [ ] Set up test framework
   - [ ] Write unit tests
   - [ ] Create integration tests
   - [ ] Add E2E tests

2. **Example Data**
   - [ ] Create sample schemas
   - [ ] Build example blueprints
   - [ ] Add demo datasets
   - [ ] Create tutorial workflow

3. **Documentation**
   - [ ] Write user guide
   - [ ] Create API documentation
   - [ ] Add inline code comments
   - [ ] Build troubleshooting guide

4. **Deployment**
   - [ ] Configure GitHub Pages
   - [ ] Set up CI/CD pipeline
   - [ ] Create build scripts
   - [ ] Add deployment documentation

## Architecture Decisions

### State Management
- Use a centralized state manager for application state
- Implement event-driven updates for reactive UI
- Persist state in IndexedDB for session recovery

### Performance Strategy
- Utilize WebWorkers for CPU-intensive tasks (embeddings, transformations)
- Implement virtual scrolling in AG-Grid for large datasets
- Use lazy loading for tab content
- Cache API responses in memory and IndexedDB

### Security Considerations
- Never store API keys in blueprint files
- Sanitize all user inputs
- Run transformation code in sandboxed environment
- Implement CSP headers for GitHub Pages

### Modularity Principles
- Each tab operates as an independent module
- Shared utilities in centralized location
- Clear separation between UI and business logic
- Plugin architecture for future LLM providers

## Development Guidelines

### Code Style
- Use ES6+ features and modern JavaScript
- Follow consistent naming conventions
- Implement proper error handling
- Add JSDoc comments for all public APIs

### Git Workflow
- Feature branches for each sprint
- Semantic commit messages
- Pull requests for code review
- Tagged releases for milestones

### Testing Strategy
- Unit tests for utilities and core logic
- Integration tests for workflows
- Manual testing checklist for UI
- Performance benchmarks for large datasets

## Risk Mitigation

### Technical Risks
- **WebR Loading Time**: Implement progressive loading with status indicators
- **Large Dataset Performance**: Use pagination and virtual scrolling
- **Browser Compatibility**: Test on Chrome, Firefox, Safari, Edge
- **API Rate Limits**: Implement request queuing and caching

### User Experience Risks
- **Complexity**: Provide guided workflows and tutorials
- **Data Loss**: Implement auto-save and recovery mechanisms
- **Learning Curve**: Create comprehensive documentation and examples

## Success Metrics
- Page load time < 3 seconds
- Time to first interaction < 1 second
- Support for schemas with 1000+ variables
- Support for datasets with 100k+ rows
- Zero server dependencies
- Full keyboard accessibility

## Timeline
- **Sprint 1-3**: Foundation (Weeks 1-3)
- **Sprint 4-6**: Core Features (Weeks 4-6)
- **Sprint 7-8**: Advanced Features (Weeks 7-8)
- **Sprint 9-10**: Polish & Deploy (Weeks 9-10)

Total estimated development time: 10 weeks

## Deliverables
1. Fully functional web application
2. Comprehensive documentation
3. Example schemas and datasets
4. Deployment on GitHub Pages
5. Open-source repository with MIT license

## Completed Work Summary

### ✅ What's Been Built
1. **Complete project infrastructure** with Vite, Tailwind CSS, and all dependencies
2. **Responsive UI layout** with header, collapsible data panel, and workspace tabs
3. **Component architecture** with modular JavaScript classes
4. **Storage layer** with IndexedDB integration for all data persistence
5. **Advanced schema management** with multi-schema loading, validation, and reference resolution
6. **Full Data Panel** with blueprint management, schema loading, and data upload
7. **Gemini AI Integration** with dynamic model listing, embeddings, and chat capabilities
8. **Quality Control System** with Ajv validation, AG-Grid display, and interactive error reporting
9. **Data Components**:
   - AG-Grid integration for tabular data display
   - Schema viewer with searchable data dictionary format
   - CSV/TSV/JSON parser with automatic type detection
10. **AI Features**:
   - API key validation and secure storage
   - Dynamic model discovery from Gemini API
   - Configurable embedding dimensions (128-3072)
   - Test functionality for both embeddings and chat

### 🚧 Ready for Next Phase
The application now has a solid foundation with completed core systems. Next priorities:
- **Vocabulary Mapper RAG System**: Implement semantic search with EntityDB vector database
- **WebWorker Infrastructure**: Set up batch embedding processing in background threads
- **Mapping UI Components**: Build the mapping workbench with navigation and actions
- **CodeMirror Integration**: Add code editor for Data Transform tab
- **WebR Runtime**: Enable R code execution in the browser
- **Chat Interface**: Complete the floating chat UI with system prompts

### 📁 Repository Structure Created
```
epiharmony/
├── src/
│   ├── components/     # UI components
│   │   ├── dataPanel.js    # Configuration panel with AI setup
│   │   ├── workspace.js    # Tab container
│   │   ├── header.js       # App header
│   │   ├── dataGrid.js     # AG-Grid wrapper
│   │   └── schemaViewer.js # Schema dictionary display
│   ├── core/          # Core functionality
│   │   └── storage.js      # IndexedDB operations
│   ├── services/      # External services
│   │   └── gemini.js       # Gemini AI integration
│   ├── tabs/          # Tab implementations
│   │   ├── vocabularyMapper.js  # Mapping workflow
│   │   ├── dataTransform.js     # Code generation
│   │   └── qualityControl.js    # Validation system
│   ├── utils/         # Utilities
│   │   ├── schema.js       # Schema processing
│   │   └── validator.js    # Ajv validation
│   ├── workers/       # WebWorkers (ready for implementation)
│   └── styles/        # CSS with Tailwind
├── tests/             # Test scripts
│   ├── test-gemini.js      # Gemini API test
│   └── test-models-list.js # Model listing test
├── assets/logo/       # All SVG logos
├── public/schema/     # Example schemas directory
└── .github/workflows/ # CI/CD configuration
```