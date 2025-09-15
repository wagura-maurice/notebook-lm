# EU ALMPO+ - Enhanced AI Research Assistant

## 🚀 Project Overview

EU ALMPO+ is an advanced AI-powered research and knowledge management platform that goes beyond traditional note-taking. Built as an enhanced alternative to Google's EU ALMPO, this platform combines powerful document processing with intelligent AI capabilities to transform how you interact with your research materials.

### ✨ Enhanced Features

- **Multi-Format Document Support**

  - Upload and process PDFs, Word documents, text files, and web articles
  - Automatic text extraction and formatting
  - Support for academic papers with citation management

- **Advanced AI Capabilities**

  - Context-aware document summarization
  - Key concept extraction and mind mapping
  - Interactive Q&A with source citation
  - Multi-document analysis and comparison

- **Productivity Tools**

  - Smart note-taking with markdown support
  - Customizable knowledge graphs
  - Collaborative workspaces
  - Version history and change tracking

- **Enhanced Security**
  - End-to-end encryption for private notes
  - Customizable privacy controls
  - Local processing option for sensitive documents

## 🏗️ Project Structure

```
eu_almpo-lm/
├── assets/          # Static assets and resources
│   ├── css/         # Stylesheets
│   │   ├── auth.css
│   │   ├── collection.css
│   │   └── main.css
│   ├── js/          # JavaScript modules
│   │   ├── auth/
│   │   ├── core/
│   │   └── utils/
│   └── images/      # Image assets
│       ├── icons/
│       └── logo.svg
├── auth/            # Authentication system
│   ├── login.html
│   ├── register.html
│   └── reset-password.html
├── pages/           # Application pages
│   ├── collection/  # Document collections
│   ├── editor/      # Note editor
│   └── settings/    # User settings
├── index.html       # Main application entry
├── wizard.html      # Onboarding wizard
├── privacy.html     # Privacy policy
├── terms.html       # Terms of service
└── README.md        # This documentation
```

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Custom components with responsive design
- **State Management**: Custom implementation
- **Build Tools**: Webpack, Babel
- **Testing**: Jest, Cypress
- **Version Control**: Git

## Getting Started

### Prerequisites

- A modern web browser
- [Optional] Node.js and npm (for future build tools and enhancements)

### Running Locally

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd eu_almpo-lm
   ```
2. Open `index.html` in your browser to explore the main interface.

### File Overview

- `index.html`: Main entry point for the app.
- `collection.html`: Page for managing document collections.
- `auth/`: Contains authentication-related HTML pages (sign-in, sign-up, password reset).
- `js/`: JavaScript logic for different app modules.
- `css/`: Stylesheets for different sections of the app.
- `images/`, `fonts/`: Static assets.

## Usage

- Upload documents to create a collection.
- Use the AI-powered chat to ask questions about your documents.
- Take notes in the note-taking studio and organize them within collections.

## Development Notes

- The project currently uses vanilla HTML, CSS, and JS. No frameworks are required for basic usage.
- See `eu_almpo-lm-logic.md` for future plans:
  - Rebuild using TailwindCSS, Vanilla JS (no jQuery), and modern build tools (Vite, Gulp).
  - UI/UX improvements (e.g., modal positioning, responsive design).

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork and submit a pull request

## License

Specify your license here (e.g., MIT, Apache 2.0).

## Contact

For questions or suggestions, open an issue or contact the project maintainer.

---
