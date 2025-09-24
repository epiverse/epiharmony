# epiHarmony Implementation Plan

## Project Overview
epiHarmony is a client-side web application for LLM-assisted epidemiological data harmonization. It guides users through a three-step workflow: vocabulary mapping, data transformation, and quality control.

## Technology Stack
- **Build Tool**: Vite 7.1.7
- **Styling**: Tailwind CSS 4.1.13
- **Data Grid**: AG-Grid Community 34.2.0
- **AI/LLM**: @google/genai 1.20.0 (Gemini)
- **Vector DB**: @babycommando/entity-db 1.0.11
- **Validation**: Ajv.js 8.17.1
- **Code Editor**: CodeMirror 6.0.2
- **R Runtime**: webr 0.5.5
- **Storage**: idb 8.0.3

## Development Phases

### Phase 1: Foundation & Project Setup (Sprint 1)
**Goal**: Establish project infrastructure and development environment

#### Tasks:
1. **Project Initialization**
   - [x] Create PLAN.md documentation
   - [ ] Initialize Vite project with proper configuration
   - [ ] Set up package.json with all dependencies
   - [ ] Configure .gitignore for Node.js project
   - [ ] Create README.md with project overview

2. **Build Configuration**
   - [ ] Configure Vite for production build
   - [ ] Set up Tailwind CSS with Amber color theme
   - [ ] Configure PostCSS for Tailwind processing
   - [ ] Set up development server with hot reload
   - [ ] Configure static asset handling

3. **Directory Structure**
   - [ ] Create src/ directory hierarchy
   - [ ] Set up public/ directory for static assets
   - [ ] Organize assets/logo/ files
   - [ ] Create placeholder files for all modules

### Phase 2: UI Framework & Layout (Sprint 2)
**Goal**: Build the foundational UI components and layout structure

#### Tasks:
1. **Base Layout**
   - [ ] Create index.html with semantic structure
   - [ ] Implement responsive grid layout
   - [ ] Add Google Fonts (Dancing Script)
   - [ ] Set up favicon with epiharmony-logo-bg.svg

2. **Header Component**
   - [ ] Create static header with amber-900 background
   - [ ] Add epiHarmony logo and branding
   - [ ] Implement GitHub repository link
   - [ ] Apply Dancing Script font to app name

3. **Data Panel Component**
   - [ ] Build collapsible panel mechanism
   - [ ] Add smooth transition animations
   - [ ] Create form layout for all inputs
   - [ ] Implement show/hide toggle button

4. **Workspace Container**
   - [ ] Create tab navigation system
   - [ ] Add tab switching logic
   - [ ] Style active/inactive tab states
   - [ ] Add tab icons from assets

### Phase 3: Core Systems (Sprint 3)
**Goal**: Implement fundamental application systems

#### Tasks:
1. **State Management**
   - [ ] Design state architecture
   - [ ] Implement blueprint state manager
   - [ ] Create event system for state changes
   - [ ] Add state persistence logic

2. **Storage Layer**
   - [ ] Set up IndexedDB with idb wrapper
   - [ ] Create database schema
   - [ ] Implement CRUD operations
   - [ ] Add data migration system

3. **Blueprint System**
   - [ ] Define blueprint JSON schema
   - [ ] Implement blueprint serialization
   - [ ] Create import/export functions
   - [ ] Add URL parameter handling

4. **Schema Management**
   - [ ] Create schema loader
   - [ ] Implement schema validation
   - [ ] Add schema parsing utilities
   - [ ] Build reference resolution system

### Phase 4: Data Panel Implementation (Sprint 4)
**Goal**: Complete the configuration panel functionality

#### Tasks:
1. **Blueprint File Management**
   - [ ] Implement "Create New" functionality
   - [ ] Add file upload handler
   - [ ] Create URL loader with validation
   - [ ] Update browser URL on load
   - [ ] Add "Clear Project" button

2. **Schema Loaders**
   - [ ] Build source schema input UI
   - [ ] Create target schema input UI
   - [ ] Implement multi-URL support
   - [ ] Add main schema selection
   - [ ] Create validation feedback

3. **Data Upload**
   - [ ] Implement file input for CSV/TSV/JSON
   - [ ] Create data parser
   - [ ] Add data preview
   - [ ] Store data in memory

4. **AI Configuration**
   - [ ] Create Gemini API key input
   - [ ] Implement key validation
   - [ ] Build model selection dropdowns
   - [ ] Add embedding dimension controls
   - [ ] Create "Forget API Key" function

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

### Phase 8: Quality Control Implementation (Sprint 8)
**Goal**: Create the validation and quality control system

#### Tasks:
1. **Validation Engine**
   - [ ] Integrate Ajv.js library
   - [ ] Create validation processor
   - [ ] Build error aggregator
   - [ ] Implement row-level validation

2. **Data Validation Tab**
   - [ ] Create AG-Grid with error highlighting
   - [ ] Add status column with icons
   - [ ] Build error tooltips
   - [ ] Implement error filtering

3. **Error Summary Panel**
   - [ ] Create error grouping logic
   - [ ] Build interactive error list
   - [ ] Add click-to-filter functionality
   - [ ] Implement export to CSV

4. **Schema Dictionary Tab**
   - [ ] Create schema viewer
   - [ ] Add search functionality
   - [ ] Implement variable highlighting
   - [ ] Build cross-tab navigation

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