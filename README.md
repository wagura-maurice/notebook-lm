<!-- README.md -->

# Notebook LM Project Structure

## Project Overview

The Notebook LM project aims to create an AI-powered study guide and research tool. It allows users to upload documents, generate summaries, extract key topics, and engage in a conversational chat with an AI model based on the uploaded content. The project is designed to help users organize their research materials and create personalized study guides efficiently.

**Key Features:**

- **Document Upload:** Users can upload various document types (like PDF, Word, Text) to create a collection of sources.
- **AI-Powered Analysis:** The system processes uploaded documents to generate summaries, identify key topics, and extract metadata.
- **Interactive Chat:** Users can ask questions about their sources and receive AI-generated responses based on the document content.
- **Note-Taking Studio:** A dedicated area for users to create and manage notes, which can also be converted into sources.
- **Organized Collections:** The platform provides a structured way to manage multiple sources and notes within a collection.

## Project Structure

This project is built using standard web technologies: HTML for structure, CSS for styling, and JavaScript for interactivity and dynamic content.

## Directory Structure

```
notebook-lm/
├── auth/           # Authentication HTML pages (sign-in, sign-up, etc.)
├── css/            # Stylesheets (auth.css, collection.css, index.css)
├── fonts/          # Font files
├── images/         # Image assets (e.g., logo)
├── js/             # JavaScript files (auth.js, collection.js, index.js)
├── .github/        # GitHub configuration and workflows
├── .vscode/        # VS Code workspace settings
├── .idx/           # Indexing or cache (purpose-specific)
├── .git/           # Git repository data
├── collection.html # Collection page
├── index.html      # Main landing page
├── privacy.html    # Privacy policy
├── terms.html      # Terms of service
├── README.md       # Project documentation
├── notebook-lm-logic.md # Project logic and build notes
└── .gitignore      # Git ignore file
```

## Getting Started

### Prerequisites

- A modern web browser
- [Optional] Node.js and npm (for future build tools and enhancements)

### Running Locally

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd notebook-lm
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
- See `notebook-lm-logic.md` for future plans:
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
