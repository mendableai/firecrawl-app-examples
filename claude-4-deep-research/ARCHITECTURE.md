# Application Architecture

The Claude 4 Deep Research Assistant has been designed with a clean, decoupled architecture that separates concerns and makes the codebase maintainable and extensible.

## Architecture Overview

```plaintext
src/
├── claude_deep_research_app.py    # UI Layer (Streamlit interface)
├── config.py                      # Configuration settings
└── core/                          # Business Logic Layer
    ├── __init__.py               # Module exports
    ├── clients.py                # API client management
    ├── research.py               # Research functionality
    └── chat.py                   # Chat and Claude interactions
```

## Layer Separation

### 1. UI Layer (`claude_deep_research_app.py`)

- **Responsibility**: Streamlit interface and user interactions
- **Dependencies**: Core modules, configuration
- **Contains**:
  - Streamlit components and layout
  - User input handling
  - Display logic
  - Session state management

### 2. Business Logic Layer (`core/`)

- **Responsibility**: Core application functionality
- **Dependencies**: External APIs (Anthropic, Firecrawl)
- **Modules**:

#### `clients.py` - API Client Management

- Manages Anthropic and Firecrawl API clients
- Handles authentication and connection
- Provides singleton-like client access
- API key validation

#### `research.py` - Research Engine

- Defines research tool schema
- Executes deep research operations
- Detects research requests
- Handles research results

#### `chat.py` - Chat Engine

- Manages Claude interactions
- Handles tool use workflow
- Provides streaming functionality
- Message preparation and formatting

### 3. Configuration Layer (`config.py`)

- **Responsibility**: Application settings and constants
- **Contains**:
  - Model configuration
  - Default parameters
  - UI text and messages
  - Feature flags

## Benefits of This Architecture

### 1. **Separation of Concerns**

- UI logic is separate from business logic
- Each module has a single responsibility
- Easy to understand and maintain

### 2. **Testability**

- Core logic can be tested independently of UI
- Mock clients for testing
- Isolated unit tests for each component

### 3. **Reusability**

- Core modules can be used in different interfaces
- Business logic is framework-agnostic
- Easy to create CLI, API, or other interfaces

### 4. **Maintainability**

- Changes to UI don't affect business logic
- Configuration changes are centralized
- Clear module boundaries

### 5. **Extensibility**

- Easy to add new research engines
- Simple to integrate additional AI models
- Straightforward to add new features

## Usage Examples

### Using Core Components Independently

```python
from core import ClientManager, ResearchEngine, ChatEngine

# Initialize components
client_manager = ClientManager()
research_engine = ResearchEngine(client_manager)
chat_engine = ChatEngine(client_manager, research_engine)

# Use research engine directly
result = research_engine.execute_research("quantum computing trends")

# Use chat engine for conversations
response = chat_engine.get_response_with_tools(
    messages=[{"role": "user", "content": "Hello"}],
    tools=[research_engine.get_tool_definition()]
)
```

### Creating Alternative Interfaces

The decoupled architecture makes it easy to create different interfaces:

- **CLI Interface**: Use core modules with argparse
- **API Server**: Use core modules with FastAPI/Flask
- **Jupyter Notebook**: Import and use core modules directly
- **Desktop App**: Use core modules with tkinter/PyQt

## Future Enhancements

The architecture supports easy addition of:

1. **New Research Engines**: Implement additional research providers
2. **Multiple AI Models**: Support for different LLM providers
3. **Caching Layer**: Add Redis/database caching
4. **Authentication**: User management and API key handling
5. **Analytics**: Usage tracking and metrics
6. **Plugin System**: Extensible tool framework

## Testing Strategy

```python
# Example test structure
tests/
├── test_clients.py      # Test API client management
├── test_research.py     # Test research functionality
├── test_chat.py         # Test chat interactions
└── test_integration.py  # Test component integration
```

This architecture ensures the application remains maintainable, testable, and extensible as it grows in complexity.
